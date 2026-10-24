"""Render the private stack configuration on sekta2 and deploy it to Swarm."""

from pathlib import Path
import os
import subprocess
import tempfile


team = Path(__file__).resolve().parents[1]
configuration = subprocess.run(
    ["docker", "compose", "--env-file", ".env", "-f", "swarm.yml", "config"],
    cwd=team,
    check=True,
    capture_output=True,
    text=True,
).stdout
# Compose emits its local project name; docker stack deploy does not accept it.
configuration = "\n".join(
    line for line in configuration.splitlines() if not line.startswith("name: ")
) + "\n"

handle, filename = tempfile.mkstemp(prefix="content-room-stack-", suffix=".yml")
try:
    os.fchmod(handle, 0o600)
    with os.fdopen(handle, "w") as output:
        output.write(configuration)
    subprocess.run(
        ["docker", "stack", "deploy", "--resolve-image", "never", "-c", filename, "content-room"],
        cwd=team,
        check=True,
    )
finally:
    Path(filename).unlink(missing_ok=True)
