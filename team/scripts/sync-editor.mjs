import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const output = path.resolve(process.cwd(), "public/editor");
await mkdir(output, { recursive: true });
const entries = await readdir(root, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isFile() && /\.(html|css|js)$/.test(entry.name)) {
    await cp(path.join(root, entry.name), path.join(output, entry.name));
  }
}
for (const folder of ["assets", "data", "type-studio"]) {
  await cp(path.join(root, folder), path.join(output, folder), { recursive: true });
}
