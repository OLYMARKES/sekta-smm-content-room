// Server-only regressions. In-memory storage and transport; no browser or network.
const test = require("node:test");
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const key = "sekta-media-people-overrides-v1";
const plain = (value) => JSON.parse(JSON.stringify(value));
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

async function harness({ raw = null, write = async () => {} } = {}) {
  const code = await readFile(path.join(__dirname, "..", "media-overrides.js"), "utf8");
  const disk = { raw, writes: 0, failRead: false, failWrite: false };
  const storage = {
    getItem(requestedKey) {
      assert.equal(requestedKey, key);
      if (disk.failRead) throw new Error("blocked storage");
      return disk.raw;
    },
    setItem(requestedKey, value) {
      assert.equal(requestedKey, key);
      if (disk.failWrite) throw new Error("quota exceeded");
      disk.raw = value;
      disk.writes += 1;
    },
  };
  const context = { window: {} };
  vm.runInNewContext(code, context, { filename: "media-overrides.js" });
  const reopen = () => context.window.SEKTA_MEDIA_OVERRIDES.create({ getStorage: () => storage, key, write });
  return { store: reopen(), reopen, disk };
}

test("stage persists before the transport is invoked", async () => {
  let calls = 0;
  const { store, disk } = await harness({ write: async () => { calls += 1; } });
  store.stage("photo", { people: ["Оля"] });
  assert.equal(calls, 0);
  assert.deepEqual(JSON.parse(disk.raw).photo.people, ["Оля"]);
  assert.equal(store.get("photo").pending, true);
});

test("server acknowledgement keeps the local copy across reloads", async () => {
  const { store, reopen } = await harness();
  store.stage("photo", { people: ["Оля"], top: true });
  await store.sync("photo");
  const restored = reopen();
  assert.deepEqual(plain(restored.get("photo").people), ["Оля"]);
  assert.equal(restored.get("photo").top, true);
  assert.equal(restored.get("photo").pending, false);
  assert.equal(restored.pendingIds().length, 0);
});

test("editing names preserves a pending top flag from the legacy format", async () => {
  const sent = [];
  const { store } = await harness({
    raw: JSON.stringify({ photo: { top: true, pending: true } }),
    write: async (id, patch) => { sent.push({ id, ...plain(patch) }); },
  });
  store.stage("photo", { people: ["Вера"] });
  await store.sync("photo");
  assert.deepEqual(sent, [{ id: "photo", people: ["Вера"], top: true }]);
  assert.equal(store.get("photo").top, true);
});

test("acknowledged fields are retained locally but are not sent on unrelated edits", async () => {
  const sent = [];
  const { store } = await harness({ write: async (id, patch) => { sent.push(plain(patch)); } });
  store.stage("photo", { people: ["Оля"] });
  await store.sync("photo");
  store.stage("photo", { top: false });
  await store.sync("photo");
  assert.deepEqual(sent, [{ people: ["Оля"] }, { top: false }]);
  assert.deepEqual(plain(store.get("photo").people), ["Оля"]);
});

test("failed transport leaves pending edits durable and can be retried", async () => {
  let fail = true;
  const { store, reopen } = await harness({ write: async () => { if (fail) throw new Error("offline"); } });
  store.stage("photo", { top: true });
  await assert.rejects(store.sync("photo"), /offline/);
  assert.equal(reopen().get("photo").pending, true);
  fail = false;
  await store.sync("photo");
  assert.equal(reopen().get("photo").pending, false);
});

test("quota errors do not change the stored or in-memory version", async () => {
  const { store, disk } = await harness();
  store.stage("photo", { top: false });
  const before = disk.raw;
  disk.failWrite = true;
  assert.throws(() => store.stage("photo", { top: true }), /не сохранено/);
  assert.equal(store.get("photo").top, false);
  assert.equal(disk.raw, before);
});

test("a failed acknowledgement write retains the pending copy", async () => {
  const { store, disk, reopen } = await harness({ write: async () => { disk.failWrite = true; } });
  store.stage("photo", { people: ["Оля"] });
  await assert.rejects(store.sync("photo"), /не сохранено/);
  assert.equal(store.get("photo").pending, true);
  assert.equal(reopen().get("photo").pending, true);
});

test("corrupt storage is not replaced with an empty catalogue", async () => {
  for (const raw of ["{broken", "[]", "null"]) {
    const { store, disk } = await harness({ raw });
    assert.throws(() => store.stage("photo", { top: true }), /не перезаписаны/);
    assert.equal(disk.raw, raw);
    assert.equal(disk.writes, 0);
    assert.match(store.storageError(), /не перезаписаны/);
  }
});

test("blocked storage does not report a successful save", async () => {
  const { store, disk, reopen } = await harness();
  disk.failRead = true;
  assert.throws(() => store.stage("photo", { top: true }), /недоступно/);
  assert.throws(() => reopen().stage("photo", { top: true }), /не перезаписаны/);
  assert.equal(disk.writes, 0);
});

test("a detected edit from another tab blocks writes and transport", async () => {
  let calls = 0;
  const { store, disk } = await harness({ write: async () => { calls += 1; } });
  store.stage("photo", { top: true });
  const external = JSON.stringify({ other: { people: ["Вера"], pending: true } });
  disk.raw = external;
  assert.throws(() => store.stage("photo", { top: false }), /другой вкладке/);
  await assert.rejects(store.sync("photo"), /другой вкладке/);
  assert.equal(calls, 0);
  assert.equal(disk.raw, external);
  assert.match(store.storageError(), /другой вкладке/);
});

test("a late acknowledgement cannot overwrite another tab's record", async () => {
  const started = deferred();
  const release = deferred();
  const { store, disk } = await harness({ write: async () => { started.resolve(); await release.promise; } });
  store.stage("photo", { top: true });
  const sync = store.sync("photo");
  await started.promise;
  const external = JSON.stringify({ photo: { top: false, pending: true } });
  disk.raw = external;
  release.resolve();
  await assert.rejects(sync, /другой вкладке/);
  assert.equal(disk.raw, external);
  assert.match(store.storageError(), /другой вкладке/);
});

test("startup sync and newer edits are serialized without clearing newer pending data", async () => {
  const started = deferred();
  const release = deferred();
  const nextStarted = deferred();
  const nextRelease = deferred();
  const sent = [];
  const { store } = await harness({
    raw: JSON.stringify({ photo: { top: true, pending: true } }),
    write: async (id, patch) => {
      sent.push(plain(patch));
      if (sent.length === 1) { started.resolve(); await release.promise; }
      else { nextStarted.resolve(); await nextRelease.promise; }
    },
  });
  const first = store.sync("photo");
  await started.promise;
  store.stage("photo", { top: false, people: ["Оля"] });
  const second = store.sync("photo");
  assert.equal(sent.length, 1);
  release.resolve();
  assert.equal(await first, false);
  await nextStarted.promise;
  assert.equal(store.get("photo").pending, true);
  assert.equal(store.get("photo").top, false);
  nextRelease.resolve();
  await second;
  assert.deepEqual(sent, [{ top: true }, { people: ["Оля"], top: false }]);
  assert.equal(store.get("photo").pending, false);
});

test("empty names and false top values are preserved, not dropped as falsy", async () => {
  const { store, reopen } = await harness();
  store.stage("photo", { people: [], top: false });
  await store.sync("photo");
  assert.deepEqual(plain(reopen().get("photo").people), []);
  assert.equal(reopen().get("photo").top, false);
});

test("staging one material preserves unrelated records and does not retain mutable input", async () => {
  const { store, disk } = await harness({ raw: JSON.stringify({ other: { top: true, pending: true, custom: "keep" } }) });
  const people = ["Оля"];
  store.stage("photo", { people });
  people[0] = "Changed elsewhere";
  assert.deepEqual(plain(store.get("photo").people), ["Оля"]);
  assert.deepEqual(JSON.parse(disk.raw).other, { top: true, pending: true, custom: "keep" });
});
