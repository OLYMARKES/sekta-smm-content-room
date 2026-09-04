// Explicitly approved server-only, read-only post-deployment check.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
assert.equal(process.env.SEKTA_SERVER_CHECKS, "1", "Server checks require explicit authorization");
const engine = process.env.BROWSER || "chromium";
const { [engine]: browserType } = require("playwright");
const base = "https://olymarkes.github.io/sekta-smm-content-room/";
const root = path.resolve(__dirname, "..");
const output = path.join(root, "output/playwright");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
let browser;

async function main() {
  const files = ["index.html", "app.js", "carousel-builder.js", "media-source.js", "media-overrides.js", "workspace-safety.js", "styles.css", "type-studio/carousel-type-lab.html", "type-studio/carousel-type-lab.js", "type-studio/embedded.js", "assets/brand/sekta-logo-round.png"];
  const verified = [];
  for (const file of files) {
    const expected = await fs.readFile(path.join(root, file));
    const response = await fetch(`${base}${file}?release=${process.env.GITHUB_SHA}`, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, file);
    assert.equal(digest(Buffer.from(await response.arrayBuffer())), digest(expected), `Published bytes: ${file}`);
    verified.push(file);
  }
  browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  // The published app must never reach a local service from this read-only check.
  await context.route("http://127.0.0.1:4318/**", (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}?release=${process.env.GITHUB_SHA}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => window.SEKTA_MEDIA_OVERRIDES && document.querySelectorAll("#builderSlides [data-builder-slide]").length > 0);
  await page.locator('.nav-item[data-view="builder"]').click();
  assert(await page.locator("#builderSaveDraft").isVisible());
  assert.deepEqual(errors, [], "Published page errors");
  await fs.mkdir(output, { recursive: true });
  await page.screenshot({ path: path.join(output, "published-builder.png"), fullPage: true });
  await fs.writeFile(path.join(output, "published.json"), JSON.stringify({ sha: process.env.GITHUB_SHA, engine, verified, pageErrors: errors }, null, 2));
  console.log(`PASS ${engine}: published bytes match checkout; app starts without page errors`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
});
