// Server-only regression tests. No browser, network, packages, or personal data.
const test = require("node:test");
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const baseURI = "https://preview.example/sekta-smm-content-room/";
const absolute = (value) => new URL(value, baseURI).href;

async function harness(failingPaths = []) {
  const code = await readFile(path.join(__dirname, "..", "media-source.js"), "utf8");
  const requested = [];
  const failing = new Set(failingPaths.map(absolute));
  class FakeImage {
    set src(url) {
      requested.push({ url, crossOrigin: this.crossOrigin });
      queueMicrotask(() => {
        if (failing.has(url)) return this.onerror?.();
        this.naturalWidth = 2160;
        this.naturalHeight = 2700;
        this.onload?.();
      });
    }
    removeAttribute() {}
  }
  const context = { window: {}, document: { baseURI }, URL, Image: FakeImage, setTimeout, clearTimeout };
  vm.runInNewContext(code, context, { filename: "media-source.js" });
  return { source: context.window.SEKTA_MEDIA_SOURCE, requested };
}

test("relative paths retain the GitHub Pages project prefix", async () => {
  const { source } = await harness();
  assert.equal(source.candidates({ thumb: "assets/preview.jpg" })[0].url, absolute("assets/preview.jpg"));
});

test("unsupported schemes and embedded credentials are not used", async () => {
  const { source } = await harness();
  for (const value of ["javascript:alert(1)", "data:image/png;base64,x", "file:///private/photo.jpg", "https://user:secret@preview.example/photo.jpg", "", null]) {
    assert.equal(source.candidates({ originalUrl: value }).length, 0);
  }
});

test("a valid export copy wins over an original and thumbnail", async () => {
  const { source, requested } = await harness();
  const result = await source.loadForExport({ exportImage: "export.jpg", originalUrl: "original.jpg", thumb: "thumb.jpg" });
  assert.equal(result.kind, "export");
  assert.deepEqual(requested, [{ url: absolute("export.jpg"), crossOrigin: "anonymous" }]);
});

test("a failed export copy falls back to a declared original, not a thumbnail", async () => {
  const { source, requested } = await harness(["export.jpg"]);
  const result = await source.loadForExport({ exportImage: "export.jpg", originalResolution: { remoteUrl: "original.jpg" }, thumb: "thumb.jpg" });
  assert.equal(result.kind, "original");
  assert.deepEqual(requested.map((item) => item.url), [absolute("export.jpg"), absolute("original.jpg")]);
});

test("cancelled preview fallback makes no thumbnail request", async () => {
  const { source, requested } = await harness(["original.jpg"]);
  let confirmations = 0;
  await assert.rejects(source.loadForExport({ originalUrl: "original.jpg", thumb: "thumb.jpg" }, {
    confirmPreview: () => { confirmations += 1; return false; },
  }), /Экспорт отменён/);
  assert.equal(confirmations, 1);
  assert.deepEqual(requested.map((item) => item.url), [absolute("original.jpg")]);
});

test("preview-only catalogue needs explicit consent for a PNG", async () => {
  const { source, requested } = await harness();
  await assert.rejects(source.loadForExport({ thumb: "thumb.jpg" }), /Экспорт отменён/);
  assert.equal(requested.length, 0);
  const result = await source.loadForExport({ thumb: "thumb.jpg" }, { confirmPreview: () => true });
  assert.equal(result.kind, "preview");
});

test("sandbox rendering uses the preview even when it duplicates the export URL", async () => {
  const { source, requested } = await harness();
  const result = await source.loadForExport({ exportImage: "same.jpg", thumb: "same.jpg", originalUrl: "original.jpg" }, { previewOnly: true });
  assert.equal(result.kind, "preview");
  assert.deepEqual(requested.map((item) => item.url), [absolute("same.jpg")]);
});

test("duplicate original links are requested once before preview fallback", async () => {
  const { source, requested } = await harness(["original.jpg"]);
  const result = await source.loadForExport({ originalResolution: { remoteUrl: "original.jpg" }, originalUrl: absolute("original.jpg"), thumb: "thumb.jpg" }, { confirmPreview: () => true });
  assert.equal(result.kind, "preview");
  assert.deepEqual(requested.map((item) => item.url), [absolute("original.jpg"), absolute("thumb.jpg")]);
});

test("missing sources reject without making a request", async () => {
  const { source, requested } = await harness();
  await assert.rejects(source.loadForExport({}), /Нет доступного изображения/);
  assert.equal(requested.length, 0);
});
