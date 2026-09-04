// Run only on an explicitly approved server. No @playwright/test or app dependencies.
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");

assert.equal(process.env.SEKTA_SERVER_CHECKS, "1", "Server checks require explicit authorization");
const engine = process.env.BROWSER || "chromium";
const { [engine]: browserType } = require("playwright");
const root = path.resolve(__dirname, "..");
const output = path.join(root, "output/playwright");
const prefix = "/sekta-smm-content-room/";
const draftKey = "sekta-cover-builder-draft-v1";
const mediaKey = "sekta-media-people-overrides-v1";
const results = [];
let browser;
let origin;
let sourceOrigin;
let sourcePng;
let delaySource = null;
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const listen = (server) => new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`)));
const stop = (server) => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); });

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://test").pathname);
    if (!pathname.startsWith(prefix)) throw new Error("Outside project prefix");
    const file = path.resolve(root, pathname.slice(prefix.length) || "index.html");
    if (!file.startsWith(root + path.sep) || pathname.split("/").some((part) => part.startsWith("."))) throw new Error("Outside project files");
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".svg": "image/svg+xml", ".json": "application/json" };
    const content = await fs.readFile(file);
    response.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});

const sources = http.createServer(async (request, response) => {
  if (request.url === "/slow.png" && delaySource) {
    delaySource.started.resolve();
    await delaySource.release.promise;
  }
  if (request.url === "/fail.png") { response.writeHead(503); response.end(); return; }
  const headers = { "Content-Type": "image/png" };
  if (request.url !== "/no-cors.png") headers["Access-Control-Allow-Origin"] = "*";
  response.writeHead(200, headers);
  response.end(sourcePng);
});

async function fresh(viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const state = { context, errors: [], missing: [], posts: [], offline: false, dialogs: "accept" };
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith("http://127.0.0.1:4318/")) {
      if (route.request().method() === "POST") state.posts.push(route.request().postDataJSON());
      return route.fulfill({ status: state.offline ? 503 : 200,
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" },
        json: { ok: !state.offline } });
    }
    if (url.startsWith(origin + "/") || url.startsWith(sourceOrigin + "/")) return route.continue();
    // No real service writes or remote-font dependency in deterministic acceptance.
    if (url.startsWith("https://fonts.googleapis.com/")) return route.fulfill({ contentType: "text/css", body: "" });
    return route.abort();
  });
  const newPage = async () => {
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    page.on("pageerror", (error) => state.errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400 && response.url().startsWith(origin + prefix)) state.missing.push(response.url().slice(origin.length));
    });
    page.on("dialog", (dialog) => state.dialogs === "dismiss" ? dialog.dismiss() : dialog.accept());
    await page.goto(origin + prefix, { waitUntil: "load" });
    await page.waitForFunction(() => document.querySelectorAll("#builderSlides [data-builder-slide]").length > 0);
    return page;
  };
  state.newPage = newPage;
  state.page = await newPage();
  return state;
}

async function view(page, name) {
  if (await page.locator("#mobileMenu").isVisible() && !(await page.locator("#sidebar").evaluate((element) => element.classList.contains("is-open")))) {
    await page.locator("#mobileMenu").click();
  }
  await page.locator(`.nav-item[data-view="${name}"]`).click();
  assert(await page.locator(`[data-view-panel="${name}"]`).evaluate((element) => element.classList.contains("is-active")));
}
const stored = (page, key) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
const saveDraft = async (page) => {
  await page.locator("#builderSaveDraft").click();
  await page.waitForFunction(() => document.querySelector("#builderDraftStatus").textContent.includes("Черновик сохранён"));
};
async function download(page, selector, name) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const file = await pending;
  const target = path.join(output, name);
  await file.saveAs(target);
  return fs.readFile(target);
}
async function check(name, run, viewport) {
  const state = await fresh(viewport);
  let deadline;
  try {
    await Promise.race([run(state), new Promise((_, reject) => {
      deadline = setTimeout(() => reject(new Error(`Scenario timed out: ${name}`)), 90000);
    })]);
    assert.deepEqual(state.errors, [], "Uncaught browser errors");
    assert.deepEqual([...new Set(state.missing)], [], "Missing project assets");
    results.push({ name, passed: true });
    console.log(`PASS ${engine}: ${name}`);
  } catch (error) {
    await state.page.screenshot({ path: path.join(output, `failure-${results.length}.png`), fullPage: true, animations: "disabled", timeout: 15000 }).catch(() => {});
    results.push({ name, passed: false, error: error.stack, pageErrors: state.errors, missing: state.missing });
    throw error;
  } finally { clearTimeout(deadline); await state.context.close(); }
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  origin = await listen(server);
  sourceOrigin = await listen(sources);
  browser = await browserType.launch({ headless: true });

  await check("real catalogue, navigation and typography", async ({ page }) => {
    assert.equal(await page.evaluate(() => window.SEKTA_LIBRARY.items.length), 2450);
    const inventory = JSON.parse(await fs.readFile(path.join(root, "docs/system-surface.json"), "utf8"));
    const mounted = inventory.sections.filter((section) => ["active", "partial"].includes(section.status)).map((section) => section.id);
    const navigation = await page.locator('.primary-nav .nav-item[data-view]').evaluateAll((buttons) => buttons.map((button) => button.dataset.view));
    assert.deepEqual([...navigation].sort(), [...mounted].sort(), "Rendered navigation must match the system inventory");
    for (const name of mounted) {
      await view(page, name);
      assert(await page.locator(`[data-view-panel="${name}"]`).isVisible(), `${name}: mounted panel must be visible`);
    }
    await view(page, "typography");
    const frame = page.frames().find((frame) => frame.url().includes("carousel-type-lab.html"));
    assert(frame, "Typography iframe loaded");
    assert(await frame.locator("body").innerText());
  });

  await check("app version and snapshot date have separate sources", async ({ page }) => {
    const metadata = await page.evaluate(() => ({ release: window.SEKTA_APP_VERSION, snapshot: window.SEKTA_CURRENT_GRID_META }));
    assert.match(metadata.release.version, /^\d{4}\.\d{2}\.\d{2}(?:\.[1-9]\d*)?$/);
    assert(["preview", "released"].includes(metadata.release.stage));
    assert.equal(await page.locator("#appVersion").innerText(), `v${metadata.release.version}`);
    assert.equal(await page.locator("#appVersionStage").isVisible(), metadata.release.stage === "preview");
    if (metadata.release.stage === "preview") assert.match(await page.locator("#appVersionStage").innerText(), /превью/);
    assert.equal(await page.locator("#snapshotDate").getAttribute("datetime"), metadata.snapshot.asOf);
    const date = await page.locator("#snapshotDate").innerText();
    assert.match(date, /25 августа 2026/);
    await view(page, "current");
    assert((await page.locator("#gridVersionLabel").innerText()).includes(date));
    assert((await page.locator("#coverModeNote").innerText()).includes(date));
    assert.match(await page.locator("#coverModeNote").innerText(), /Не обновляется автоматически/);
    assert.doesNotMatch(await page.locator(".sidebar-note").innerText(), /13 августа|актуален/);
    assert.equal(await page.locator("#currentGridSummary").innerText(), "Сохранённая сетка");
    assert.match(await page.locator("#currentGridCounts").innerText(), /12 публикаций · 3 закреплено/);
    assert.match(await page.locator('.current-heading-actions a').innerText(), /Архивная примерка/);
    await page.screenshot({ path: path.join(output, "room-desktop.png"), fullPage: true, animations: "disabled", timeout: 15000 });
  });

  await check("draft roundtrip, JSON validation and missing media", async ({ page }) => {
    await view(page, "builder");
    await page.locator("#builderHook").fill("Возвращаемся к движению без спешки");
    await page.locator("#builderSubtitle").fill("Небольшие шаги каждый день");
    await page.locator('[data-builder-style="pink"]').click();
    await page.locator('[data-builder-placement="right"]').click();
    await page.locator("#builderAccount").selectOption("@olymarkes");
    await page.locator("#builderSlides strong").first().fill("Ручной заголовок\nВторая строка");
    await page.locator("#builderSlides p").first().fill("Ручной текст\nЕщё строка");
    await saveDraft(page);
    const before = await stored(page, draftKey);
    assert.equal(before.style, "pink");
    assert.equal(before.placement, "right");
    const json = JSON.parse(await download(page, "#builderExportDraft", "draft.json"));
    assert.deepEqual(json.slides, before.slides);
    await page.reload();
    await view(page, "builder");
    assert.equal(await page.locator("#builderHook").inputValue(), before.hook);
    assert.equal(await page.locator("#builderSlides strong").first().innerText(), before.slides[0].title);
    assert.equal(await page.locator("#builderSlides p").first().innerText(), before.slides[0].body);
    for (const body of ["{broken", JSON.stringify({ ...json, version: 99 }), " ".repeat(2 * 1024 * 1024 + 1)]) {
      await page.locator("#builderDraftFile").setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from(body) });
      await page.waitForFunction(() => document.querySelector("#builderStatus").textContent.includes("Не удалось открыть"));
      assert.equal(await page.locator("#builderHook").inputValue(), before.hook);
    }
    json.hook = "";
    json.photoId = "absent-test-photo";
    json.slides[0].title = '<img src=x onerror="window.unexpected=true">';
    await page.locator("#builderDraftFile").setInputFiles({ name: "draft.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(json)) });
    await page.waitForFunction(() => document.querySelector("#builderStatus").textContent.includes("JSON открыт"));
    assert.equal(await page.locator("#builderHook").inputValue(), "");
    assert.match(await page.locator("#builderSourceStatus").innerText(), /отсутствует/);
    assert.equal(await page.locator("#builderSlides img[src=x]").count(), 0);
    assert.equal(await page.evaluate(() => window.unexpected), undefined);
  });

  await check("manual script survives cancelled regeneration and reload", async (state) => {
    const { page } = state;
    await view(page, "builder");
    await page.locator("#builderHook").fill("Ручной хук: сохранить при обновлении структуры");
    await page.locator("#builderSlides p").first().fill("Ручной сценарий: не заменять без согласия");
    await saveDraft(page);
    const before = await stored(page, draftKey);
    assert.equal(before.scriptEdited, true);
    await page.reload();
    await view(page, "builder");
    state.dialogs = "dismiss";
    const unchanged = async () => {
      assert.equal(await page.locator("#builderSlides p").first().innerText(), before.slides[0].body);
      assert.equal(await page.locator("#builderHook").inputValue(), before.hook);
    };
    await page.locator("#builderRefreshScript").click();
    await unchanged();
    await page.locator("[data-builder-idea]").first().click();
    await unchanged();
    await page.locator("#builderGoal").selectOption("comment");
    await unchanged();
    assert.equal(await page.locator("#builderGoal").inputValue(), before.controls.goal);
    await page.locator("#builderControls [type=submit]").click();
    await unchanged();
    await saveDraft(page);
    assert.deepEqual((await stored(page, draftKey)).slides, before.slides);
    state.dialogs = "accept";
    await page.locator("#builderRefreshScript").click();
    assert.notEqual(await page.locator("#builderSlides p").first().innerText(), before.slides[0].body);
    state.dialogs = "dismiss";
    await page.locator("[data-builder-idea]").first().click();
    assert.equal(await page.locator("#builderHook").inputValue(), before.hook);
    state.dialogs = "accept";
    const legacy = { ...before };
    delete legacy.scriptEdited;
    await page.locator("#builderDraftFile").setInputFiles({ name: "legacy.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(legacy)) });
    await page.waitForFunction(() => document.querySelector("#builderStatus").textContent.includes("JSON открыт"));
    state.dialogs = "dismiss";
    await page.locator("#builderRefreshScript").click();
    await unchanged();
  });

  await check("clipboard refusal is visible and legacy success is acknowledged", async ({ page }) => {
    await view(page, "builder");
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("denied"); } } });
      document.execCommand = () => false;
    });
    await page.locator("#builderCopyScript").focus();
    await page.locator("#builderCopyScript").click();
    await page.waitForFunction(() => document.querySelector("#builderStatus").textContent.includes("Не удалось скопировать"));
    assert(await page.locator("#builderCopyScript").evaluate((button) => document.activeElement === button));
    await page.evaluate(() => { document.execCommand = (command) => command === "copy"; });
    await page.locator("#builderCopyScript").click();
    await page.waitForFunction(() => document.querySelector("#builderStatus").textContent.includes("Сценарий скопирован"));
  });

  await check("workspace backup includes raw data and unsaved cover without changing view or storage", async ({ page }) => {
    await view(page, "builder");
    await saveDraft(page);
    const before = await page.evaluate((key) => {
      localStorage.setItem("sekta-sandbox", "{broken-preserve-me");
      localStorage.setItem("sekta-media-people-overrides-v1", '{"fixture":{"people":["Оля"]}}');
      localStorage.setItem("unrelated-service-token", "do-not-export");
      const raw = localStorage.getItem(key);
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new Error("quota");
        return original.call(this, name, value);
      };
      return raw;
    }, draftKey);
    await page.locator("#builderHook").fill("Текущая несохранённая обложка");
    const json = JSON.parse(await download(page, "#exportWorkspaceBackup", "local-backup.json"));
    assert.equal(json.schema, "sekta-local-backup");
    assert.equal(json.version, 1);
    assert.equal(json.coverDraft.hook, "Текущая несохранённая обложка");
    assert.equal(json.entries.find((entry) => entry.key === draftKey).raw, before);
    assert.equal(json.entries.find((entry) => entry.key === "sekta-sandbox").raw, "{broken-preserve-me");
    assert.deepEqual(JSON.parse(json.entries.find((entry) => entry.key === mediaKey).raw), { fixture: { people: ["Оля"] } });
    assert(!JSON.stringify(json).includes("do-not-export"));
    assert(await page.locator('[data-view-panel="builder"]').evaluate((panel) => panel.classList.contains("is-active")));
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), draftKey), before);
    assert.equal(await page.evaluate(() => localStorage.getItem("sekta-sandbox")), "{broken-preserve-me");
    assert.match(await page.locator("#workspaceBackupStatus").innerText(), /Автовосстановления пока нет/);
    assert.equal(await page.locator("#exportWorkspaceBackup").getAttribute("aria-pressed"), null);
  });

  await check("workspace backup refuses a partial copy when a key cannot be read", async ({ page }) => {
    await page.evaluate(() => {
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key) {
        if (key === "olymarkes-type-case-mode-v1") throw new Error("blocked");
        return original.call(this, key);
      };
    });
    let downloads = 0;
    page.on("download", () => { downloads += 1; });
    await page.locator("#exportWorkspaceBackup").click();
    assert.match(await page.locator("#workspaceBackupStatus").innerText(), /Копия не создана/);
    assert.equal(downloads, 0);
  });

  await check("draft storage failure and two-tab conflict", async (state) => {
    const { page } = state;
    await view(page, "builder");
    await page.locator("#builderHook").fill("Первая версия");
    await saveDraft(page);
    const other = await state.newPage();
    await view(other, "builder");
    await page.locator("#builderHook").fill("Новая версия первой вкладки");
    await saveDraft(page);
    await other.waitForFunction(() => document.querySelector("#builderDraftStatus").textContent.includes("другой вкладке"));
    await other.locator("#builderHook").fill("Конфликтующая версия");
    state.dialogs = "dismiss";
    await other.locator("#builderSaveDraft").click();
    assert.equal((await stored(other, draftKey)).hook, "Новая версия первой вкладки");
    state.dialogs = "accept";
    await saveDraft(other);
    assert.equal((await stored(other, draftKey)).hook, "Конфликтующая версия");
    await other.evaluate((key) => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) { if (name === key) throw new DOMException("Quota", "QuotaExceededError"); return original.call(this, name, value); };
    }, draftKey);
    await other.locator("#builderHook").fill("Несохранённый текст");
    await other.locator("#builderSaveDraft").click();
    assert.match(await other.locator("#builderDraftStatus").innerText(), /Не удалось сохранить/);
    assert.equal((await stored(other, draftKey)).hook, "Конфликтующая версия");
    const copy = JSON.parse(await download(other, "#builderExportDraft", "unsaved-draft.json"));
    assert.equal(copy.hook, "Несохранённый текст");
  });

  await check("empty sandbox survives reload", async ({ page }) => {
    await view(page, "planner");
    while (await page.locator("#sandboxGrid [data-remove]").count()) await page.locator("#sandboxGrid [data-remove]").first().click();
    assert.deepEqual(await stored(page, "sekta-sandbox"), []);
    await page.reload();
    await view(page, "planner");
    assert.equal(await page.locator("#sandboxGrid [data-remove]").count(), 0);
    assert.equal(await page.locator("#sandboxCount").innerText(), "0 / 9");
  });

  await check("media names, top, offline reload and storage failure", async (state) => {
    const { page } = state;
    await view(page, "library");
    const id = await page.locator(".media-card-open").first().getAttribute("data-media-id");
    const name = await page.evaluate((id) => window.SEKTA_LIBRARY.items.find((item) => item.id === id).fileName, id);
    await page.locator(".media-card-open").first().click();
    await page.locator("[data-edit-people]").click();
    await page.locator('.people-form input[name="people"]').fill("Оля, Вера");
    await page.locator("#detailDialog [data-toggle-top]").click();
    assert.equal(await page.locator('.people-form input[name="people"]').inputValue(), "Оля, Вера");
    await page.locator('.people-form [type="submit"]').click();
    await page.waitForFunction(({ key, id }) => JSON.parse(localStorage.getItem(key))[id].people?.includes("Оля"), { key: mediaKey, id });
    assert.deepEqual(state.posts, [], "Local edits must not be sent to an unconfigured service");
    const saved = (await stored(page, mediaKey))[id];
    assert.deepEqual(saved.people, ["Оля", "Вера"]);
    await page.reload();
    await view(page, "library");
    await page.locator("#librarySearch").fill(name);
    await page.locator(`[data-media-id="${id}"]`).click();
    assert.match(await page.locator(".people-tags").innerText(), /Оля/);
    assert.equal(await page.evaluate((id) => window.SEKTA_LIBRARY.items.find((item) => item.id === id).isTop, id), saved.top);
    state.offline = true;
    await page.locator("[data-edit-people]").click();
    await page.locator('.people-form input[name="people"]').fill("Локальная версия");
    await page.locator('.people-form [type="submit"]').click();
    assert.equal((await stored(page, mediaKey))[id].pending, true);
    await page.reload();
    await view(page, "library");
    await page.locator("#librarySearch").fill(name);
    await page.locator(`[data-media-id="${id}"]`).click();
    assert.match(await page.locator(".people-tags").innerText(), /Локальная версия/);
    await page.evaluate((key) => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) { if (name === key) throw new Error("Quota"); return original.call(this, name, value); };
    }, mediaKey);
    await page.locator("[data-edit-people]").click();
    await page.locator('.people-form input[name="people"]').fill("Не терять введённый текст");
    await page.locator('.people-form [type="submit"]').click();
    assert.match(await page.locator(".people-save-status").innerText(), /не сохранено/);
    assert.equal(await page.locator('.people-form input[name="people"]').inputValue(), "Не терять введённый текст");
    await page.locator("#detailDialog [data-toggle-top]").click();
    assert.equal((await stored(page, mediaKey))[id].top, saved.top);
    assert.deepEqual(state.posts, [], "Reload must not send pending names to localhost");
  });

  await check("sandbox quota failure preserves the visible and stored grid", async ({ page }) => {
    await view(page, "planner");
    const before = await stored(page, "sekta-sandbox");
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "sekta-sandbox") throw new Error("quota");
        return original.call(this, key, value);
      };
    });
    await page.locator("#sandboxGrid [data-remove]").first().click();
    assert.equal(await page.locator("#sandboxGrid [data-remove]").count(), 1);
    assert.deepEqual(await stored(page, "sekta-sandbox"), before);
    assert.match(await page.locator("#sandboxSaveStatus").innerText(), /не удалось сохранить/i);
  });

  await check("CSP blocks inline script and branding keeps intrinsic dimensions", async ({ page }) => {
    await page.evaluate(() => {
      const script = document.createElement("script");
      script.textContent = "window.inlineScriptExecuted = true";
      document.body.append(script);
    });
    assert.equal(await page.evaluate(() => window.inlineScriptExecuted), undefined);
    assert(await page.locator(".brand-mark").evaluate((image) => image.complete && image.naturalWidth === 988));
    assert.equal(await page.locator('[data-cover-mode="proposed"]').isEnabled(), false);
  });

  await check("typography survives unavailable storage with visible warning", async (state) => {
    await state.context.addInitScript(() => {
      const original = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key) {
        if (key === "olymarkes-type-case-mode-v1") throw new Error("blocked storage");
        return original.call(this, key);
      };
    });
    await state.page.reload();
    await view(state.page, "typography");
    const frame = state.page.frameLocator("#coverTypographyFrame");
    await frame.locator(".font-card").first().waitFor();
    assert(await frame.locator("#storageNotice").isVisible());
    assert.match(await frame.locator("#storageNotice").innerText(), /приостановлена/);
  });

  await check("mobile menu communicates state and closes with Escape", async ({ page }) => {
    assert.equal(await page.locator("#sidebar").evaluate((sidebar) => sidebar.inert), true);
    await page.locator("#mobileMenu").click();
    assert.equal(await page.locator("#mobileMenu").getAttribute("aria-expanded"), "true");
    await page.screenshot({ path: path.join(output, "navigation-mobile.png"), animations: "disabled", timeout: 15000 });
    const bounds = await page.locator("#sidebar").boundingBox();
    assert(bounds && Math.abs(bounds.x) < 1 && bounds.width <= 390, "Open mobile sidebar must be fully on screen");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#mobileMenu").getAttribute("aria-expanded"), "false");
    assert(await page.locator("#mobileMenu").evaluate((button) => button === document.activeElement));
  }, { width: 390, height: 844 });

  await check("PNG source, frozen scene, CORS and explicit preview fallback", async (state) => {
    const { page } = state;
    await view(page, "builder");
    sourcePng = Buffer.from(await page.evaluate(() => {
      const canvas = document.createElement("canvas"); canvas.width = 2160; canvas.height = 2700;
      const ctx = canvas.getContext("2d"); ctx.fillStyle = "#91bca5"; ctx.fillRect(0, 0, 2160, 2700);
      ctx.fillStyle = "#304b42"; ctx.fillRect(600, 0, 600, 2700);
      return canvas.toDataURL("image/png").split(",")[1];
    }), "base64");
    await page.locator("#builderHook").fill("Возвращаемся к движению без спешки");
    await page.locator("#builderSubtitle").fill("Каждый маленький шаг считается");
    await page.locator('[data-builder-style="pink"]').click();
    await saveDraft(page);
    const id = (await stored(page, draftKey)).photoId;
    const setSource = (url) => page.evaluate(({ id, url }) => {
      const item = window.SEKTA_LIBRARY.items.find((item) => item.id === id);
      item.exportImage = url; item.originalUrl = ""; item.originalResolution = {};
    }, { id, url });
    await page.evaluate(() => {
      window.drawnText = [];
      const original = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
        if (this.canvas.width === 1080) window.drawnText.push({ text, x: args[0], y: args[1] });
        return original.call(this, text, ...args);
      };
    });
    delaySource = { started: deferred(), release: deferred() };
    await setSource(sourceOrigin + "/slow.png");
    const pending = download(page, "#builderDownload", "cover-pink.png");
    await delaySource.started.promise;
    await page.locator("#builderHook").fill("Следующая обложка");
    await page.locator("#builderSubtitle").fill("Другой подстрочник");
    delaySource.release.resolve();
    const png = await pending;
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 1080);
    assert.equal(png.readUInt32BE(20), 1350);
    const text = await page.evaluate(() => window.drawnText);
    assert.match(text.map((entry) => entry.text).join(" "), /Возвращаемся к движению без спешки/);
    assert.doesNotMatch(text.map((entry) => entry.text).join(" "), /Следующая обложка|Другой подстрочник/);
    assert(text.every((entry) => entry.y >= 0 && entry.y < 1350));
    assert.match(await page.locator("#builderSourceStatus").innerText(), /2160 × 2700/);
    await setSource(sourceOrigin + "/no-cors.png");
    state.dialogs = "dismiss";
    let downloads = 0;
    page.on("download", () => { downloads += 1; });
    await page.locator("#builderDownload").click();
    await page.waitForFunction(() => document.querySelector("#builderStatus").textContent.includes("Экспорт отменён"));
    assert.equal(downloads, 0);
    await setSource(sourceOrigin + "/fail.png");
    state.dialogs = "accept";
    await download(page, "#builderDownload", "cover-preview.png");
    assert.match(await page.locator("#builderSourceStatus").innerText(), /превью/);
    await page.locator("#builderAddGrid").click();
    await page.waitForFunction(() => document.querySelector("#builderStatus").textContent.includes("добавлена"));
    await view(page, "planner");
    assert.equal(await page.locator("#sandboxGrid [data-remove]").count(), 2);
  });

  await check("mobile controls, keyboard and layout", async ({ page }) => {
    await view(page, "builder");
    await page.locator("#builderHook").fill("Движение в своём темпе");
    await page.locator("#builderSaveDraft").focus();
    await page.keyboard.press("Enter");
    assert.equal((await stored(page, draftKey)).hook, "Движение в своём темпе");
    const width = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
    assert(width.content <= width.viewport + 1, JSON.stringify(width));
    await page.screenshot({ path: path.join(output, "builder-mobile.png"), fullPage: true });
  }, { width: 390, height: 844 });
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, "results.json"), JSON.stringify({ engine, results }, null, 2));
  delaySource?.release.resolve();
  if (browser) await browser.close();
  await Promise.all([stop(server), stop(sources)]);
});
