"""Set the Google OAuth client on sekta2 from two stdin lines, without logging it."""

from pathlib import Path
import re
import sys


client_id = sys.stdin.readline().strip()
client_secret = sys.stdin.readline().strip()
if not re.fullmatch(r"\d+-[a-z0-9]+\.apps\.googleusercontent\.com", client_id):
    raise SystemExit("Invalid Google OAuth client ID")
if not re.fullmatch(r"GOCSPX-[A-Za-z0-9_-]+", client_secret):
    raise SystemExit("Invalid Google OAuth client secret")

path = Path(__file__).resolve().parents[1] / ".env"
lines = path.read_text().splitlines()
updated = []
for line in lines:
    if line.startswith("GOOGLE_CLIENT_ID="):
        updated.append("GOOGLE_CLIENT_ID=" + client_id)
    elif line.startswith("GOOGLE_CLIENT_SECRET="):
        updated.append("GOOGLE_CLIENT_SECRET=" + client_secret)
    else:
        updated.append(line)
path.write_text("\n".join(updated) + "\n")
path.chmod(0o600)
print("Google OAuth configured")
