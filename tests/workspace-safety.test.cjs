// Run only on an explicitly approved server; no browser or network needed.
const test = require("node:test");
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");
assert.equal(process.env.SEKTA_SERVER_CHECKS, "1", "Server checks require explicit authorization");

const fallback = [{ id: "cover", title: "Обложка", source: "Конструктор", thumb: "assets/cover.png" }];
const plain = (value) => JSON.parse(JSON.stringify(value));
async function harness(raw = null) {
  const context = { window: {}, URL, document: { baseURI: "http://127.0.0.1:8765/sekta-smm-content-room/" } };
  vm.runInNewContext(await readFile(path.join(__dirname, "..", "workspace-safety.js"), "utf8"), context);
  const disk = { raw, fail: false };
  const storage = { getItem: () => disk.raw, setItem: (_, value) => {
    if (disk.fail) throw new Error("quota");
    disk.raw = value;
  } };
  const safety = context.window.SEKTA_WORKSPACE_SAFETY;
  const reopen = () => safety.createSandbox({ getStorage: () => storage, fallback });
  return { safety, disk, reopen, store: reopen() };
}

test("navigation accepts HTTPS and same-origin relative paths only", async () => {
  const { safety } = await harness();
  for (const url of ["javascript:alert(1)", "java\nscript:alert(1)", "data:text/html,test", "https://user:pass@example.com/", "http://example.com/a", "//example.com/a", ""]) assert.equal(safety.safeLink(url), "", url);
  assert.equal(safety.safeLink("assets/a.png"), "http://127.0.0.1:8765/sekta-smm-content-room/assets/a.png");
  assert.equal(safety.safeLink("https://drive.google.com/file/d/id/view"), "https://drive.google.com/file/d/id/view");
});

test("generated raster previews work; SVG and active data URLs do not", async () => {
  const { safety } = await harness();
  assert.equal(safety.safeImage("data:image/jpeg;base64,YQ=="), "data:image/jpeg;base64,YQ==");
  assert.equal(safety.safeImage("data:image/svg+xml,<svg/>"), "");
  assert.equal(safety.safeImage("data:text/html,hello"), "");
});

test("empty grid survives reload and returned entries are copies", async () => {
  const { store, reopen } = await harness();
  const exposed = store.get();
  exposed[0].title = "Changed outside store";
  assert.equal(store.get()[0].title, "Обложка");
  store.commit([]);
  assert.deepEqual(plain(reopen().get()), []);
});

test("quota failure leaves memory and durable copy unchanged", async () => {
  const { store, disk } = await harness();
  store.commit(fallback);
  const before = disk.raw;
  disk.fail = true;
  assert.throws(() => store.commit([]), /не удалось сохранить/i);
  assert.equal(disk.raw, before);
  assert.equal(store.get().length, 1);
});

test("observed cross-tab changes cannot be overwritten", async () => {
  const { store, disk } = await harness();
  disk.raw = "[]";
  assert.throws(() => store.commit(fallback), /другой вкладке/);
  assert.equal(disk.raw, "[]");
});

test("broken or malformed stored records remain untouched", async () => {
  for (const raw of ["{broken", "{}", "[null]", JSON.stringify([{ ...fallback[0], thumb: "javascript:alert(1)" }])]) {
    const { store, disk } = await harness(raw);
    assert(store.error());
    assert.throws(() => store.commit([]), /не удалось прочитать/);
    assert.equal(disk.raw, raw);
  }
});

test("invalid next states and overflowing grids are rejected", async () => {
  const { store, disk } = await harness();
  for (const next of [Array(10).fill(fallback[0]), [null], [{ ...fallback[0], title: {} }]]) assert.throws(() => store.commit(next));
  assert.equal(disk.raw, null);
});

test("blocked storage access does not prevent initialization", async () => {
  const { safety } = await harness();
  const store = safety.createSandbox({ getStorage: () => { throw new Error("blocked"); }, fallback });
  assert.equal(store.get().length, 1);
  assert(store.error());
  assert.throws(() => store.commit([]));
});
