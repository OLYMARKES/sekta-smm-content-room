"""Create a private PostgreSQL backup; optionally verify a full restore."""

from datetime import datetime, timezone
from pathlib import Path
import os
import subprocess
import sys
import uuid


def run(*args: str, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


container_ids = subprocess.check_output(
    ["docker", "ps", "-q", "--filter", "label=com.docker.swarm.service.name=content-room_database"],
    text=True,
).splitlines()
if len(container_ids) != 1:
    raise SystemExit("Content Room database must have exactly one running container")
container = container_ids[0]

directory = Path("/opt/content-room-backups")
directory.mkdir(mode=0o700, parents=True, exist_ok=True)
directory.chmod(0o700)
name = datetime.now(timezone.utc).strftime("content-room-%Y%m%dT%H%M%SZ")
destination = directory / f"{name}.dump"
temporary = directory / f".{name}-{uuid.uuid4().hex}.partial"
os.umask(0o077)

try:
    with temporary.open("xb") as output:
        run("docker", "exec", container, "pg_dump", "-U", "content_room", "-Fc", "content_room", stdout=output)
        output.flush()
        os.fsync(output.fileno())
    if temporary.stat().st_size < 100:
        raise RuntimeError("Backup is unexpectedly small")
    with temporary.open("rb") as archive:
        run("docker", "exec", "-i", container, "pg_restore", "--list", stdin=archive, stdout=subprocess.DEVNULL)
    temporary.rename(destination)
finally:
    temporary.unlink(missing_ok=True)

if "--verify-restore" in sys.argv:
    database = "content_room_restore_" + uuid.uuid4().hex[:12]
    run("docker", "exec", container, "psql", "-U", "content_room", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", f"CREATE DATABASE {database}", stdout=subprocess.DEVNULL)
    try:
        with destination.open("rb") as archive:
            run("docker", "exec", "-i", container, "pg_restore", "-U", "content_room", "-d", database, "--no-owner", "--no-acl", stdin=archive, stdout=subprocess.DEVNULL)
        result = subprocess.check_output(
            ["docker", "exec", container, "psql", "-U", "content_room", "-d", database, "-At", "-c", "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('user','team_member','content_series','content_series_history')"],
            text=True,
        ).strip()
        if result != "4":
            raise RuntimeError("Restored schema is missing Content Room tables")
    finally:
        run("docker", "exec", container, "psql", "-U", "content_room", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-c", f"DROP DATABASE {database} WITH (FORCE)", stdout=subprocess.DEVNULL)

print(f"Backup ready: {destination.name}" + ("; restore verified" if "--verify-restore" in sys.argv else ""))
