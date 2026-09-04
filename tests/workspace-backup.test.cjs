// Run only on an explicitly approved server. The collector never writes storage.
const test = require("node:test");
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");
assert.equal(process.env.SEKTA_SERVER_CHECKS, "1", "Server checks require explicit authorization");

const plain = (value) => JSON.parse(JSON.stringify(value));
async function collector() {
  const context = { window: {}, document: { querySelector: () => null } };
  vm.runInNewContext(await readFile(path.join(__dirname, "..", "workspace-backup.js"), "utf8"), context);
  return context.window.SEKTA_WORKSPACE_BACKUP.collect;
}
const options = (getItem) => ({ getStorage: () => ({ getItem }), origin: "https://example.com" });

test("backup reads only the named application keys, without enumerating or writing storage", async () => {
  const collect = await collector();
  const allowed = new Set(["sekta-sandbox", "sekta-media-people-overrides-v1", "sekta-cover-builder-draft-v1",
    "olymarkes-cyrillic-font-taste-v1", "olymarkes-cover-builder-v1", "olymarkes-type-case-mode-v1",
    "olymarkes-text-layout-prefs-v1", "olymarkes-type-studio-picker-v1"]);
  const reads = [];
  const backup = collect(options((key) => { assert(allowed.has(key)); reads.push(key); return null; }));
  assert.equal(backup.schema, "sekta-local-backup");
  assert.equal(backup.version, 1);
  assert.equal(backup.origin, "https://example.com");
  assert.equal(backup.entries.length, allowed.size);
  assert.deepEqual(new Set(reads), allowed);
  for (const key of allowed) assert.equal(reads.filter((value) => value === key).length, 2);
  assert.equal(new Set(backup.entries.map((entry) => entry.key)).size, allowed.size);
  assert(Number.isFinite(Date.parse(backup.createdAt)));
});

test("malformed JSON, empty strings and absent values are preserved as raw data", async () => {
  const collect = await collector();
  const values = new Map([["sekta-sandbox", "{broken"], ["sekta-media-people-overrides-v1", ""]]);
  const backup = collect(options((key) => values.get(key) ?? null));
  assert.equal(backup.entries.find((entry) => entry.key === "sekta-sandbox").raw, "{broken");
  assert.equal(backup.entries.find((entry) => entry.key === "sekta-media-people-overrides-v1").raw, "");
  assert.equal(backup.entries.find((entry) => entry.key === "sekta-cover-builder-draft-v1").raw, null);
});

test("blocked storage and read errors fail the whole backup", async () => {
  const collect = await collector();
  assert.throws(() => collect({ getStorage: () => { throw new Error("blocked"); } }), /blocked/);
  assert.throws(() => collect(options(() => { throw new Error("read failed"); })), /read failed/);
});

test("observed changes while reading fail instead of returning a mixed backup", async () => {
  const collect = await collector();
  let first = true;
  assert.throws(() => collect(options((key) => {
    if (key !== "sekta-sandbox") return null;
    if (first) { first = false; return "[]"; }
    return "[{}]";
  })), /другой вкладке/);
});

test("unexpected storage values are rejected rather than omitted by JSON serialization", async () => {
  const collect = await collector();
  for (const raw of [undefined, {}, 1]) assert.throws(() => collect(options(() => raw)), /ответ хранилища/);
});

test("current cover is included separately from the stored draft", async () => {
  const collect = await collector();
  const coverDraft = { schema: "sekta-cover-draft", version: 1, hook: "Ещё не сохранено" };
  const backup = collect({ ...options(() => null), coverDraft });
  assert.deepEqual(plain(backup.coverDraft), coverDraft);
  assert.equal(collect(options(() => null)).coverDraft, null);
});
