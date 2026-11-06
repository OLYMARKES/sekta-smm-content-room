// Run inside an isolated Content Room container with a disposable DB and Mailpit.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const origin = process.env.CONTENT_ROOM_ACCEPTANCE_ORIGIN || "http://127.0.0.1:3000";
const mailpit = "http://content-room-acceptance-mail:8025";
const password = () => randomBytes(24).toString("hex");
const ownerEmail = "qa2@example.invalid";
const reviewerEmail = "reviewer@example.invalid";

async function request(path, method = "GET", body, cookie) {
  const response = await fetch(origin + path, {
    method,
    redirect: "manual",
    headers: {
      origin,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { response, data };
}

function status(result, expected, step) {
  assert.equal(result.response.status, expected, `${step}: ${JSON.stringify(result.data).slice(0, 300)}`);
  return result.data;
}

async function mailCount() {
  const response = await fetch(mailpit + "/api/v1/messages");
  assert.equal(response.status, 200);
  return (await response.json()).total;
}

async function newestMailAfter(previousCount) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const list = await (await fetch(mailpit + "/api/v1/messages")).json();
    if (list.total > previousCount) {
      const response = await fetch(mailpit + "/api/v1/message/" + list.messages[0].ID);
      assert.equal(response.status, 200);
      return response.json();
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Verification email did not reach Mailpit");
}

async function createVerifiedUser(name, email, secret) {
  const count = await mailCount();
  status(await request("/api/auth/sign-up/email", "POST", { name, email, password: secret }), 200, `signup ${name}`);
  const mail = await newestMailAfter(count);
  const link = mail.Text.match(/https?:\/\/[^\s]+/)?.[0];
  assert.ok(link, "Verification email has no link");
  const verification = await fetch(link, { redirect: "manual" });
  assert.ok([200, 302, 303].includes(verification.status), `verify ${name}: ${verification.status}`);
  const signedIn = await request("/api/auth/sign-in/email", "POST", { email, password: secret });
  status(signedIn, 200, `sign in ${name}`);
  const cookie = signedIn.response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  assert.ok(cookie.includes("session_token"), `Missing session cookie for ${name}`);
  return cookie;
}

const beforeBlocked = await mailCount();
await request("/api/auth/sign-up/email", "POST", {
  name: "Blocked", email: "blocked-qa@example.invalid", password: password(),
});
assert.equal(await mailCount(), beforeBlocked, "Uninvited address got an email");

const ownerCookie = await createVerifiedUser("QA Owner", ownerEmail, password());
status(await request("/api/me", "GET", undefined, ownerCookie), 200, "owner access");
const firstDocument = { name: "QA series", slides: [{ title: "First", body: "One" }, { title: "Second", body: "Two" }] };
const created = status(await request("/api/series", "POST", firstDocument, ownerCookie), 201, "create series");
assert.equal(created.revision, 1);
const seriesId = created.id;
const nextDocument = { ...firstDocument, name: "QA series edited" };
status(await request(`/api/series/${seriesId}`, "PUT", { revision: 1, document: nextDocument }, ownerCookie), 200, "edit series");
status(await request(`/api/series/${seriesId}`, "PUT", { revision: 1, document: firstDocument }, ownerCookie), 409, "stale revision");
status(await request(`/api/series/${seriesId}`, "PUT", { revision: 2, status: "review" }, ownerCookie), 200, "submit review");

const invited = status(await request("/api/members", "POST", { email: reviewerEmail, role: "reviewer" }, ownerCookie), 201, "invite reviewer");
assert.equal(invited.emailed, true);
const reviewerCookie = await createVerifiedUser("QA Reviewer", reviewerEmail, password());
status(await request(`/api/series/${seriesId}`, "PUT", { revision: 3, document: firstDocument }, reviewerCookie), 403, "reviewer cannot edit");
status(await request(`/api/series/${seriesId}`, "PUT", { revision: 3, status: "approved" }, reviewerCookie), 200, "reviewer approves");
const changed = status(await request(`/api/series/${seriesId}`, "PUT", { revision: 4, document: firstDocument }, ownerCookie), 200, "editing approved resets review");
assert.equal(changed.status, "draft");
const history = status(await request(`/api/series/${seriesId}/history`, "GET", undefined, ownerCookie), 200, "history");
assert.equal(history.revisions.length, 5);
const restored = status(await request(`/api/series/${seriesId}/history`, "POST", { revision: 2, expectedRevision: 5 }, ownerCookie), 200, "restore history");
assert.equal(restored.revision, 6);
if (process.env.CONTENT_ROOM_ACCEPTANCE_BROWSER === "1") {
  const { chromium } = await import("playwright");
  const { createRequire } = await import("node:module");
  const { readFile } = await import("node:fs/promises");
  const { unzipSync } = createRequire(import.meta.url)("../../assets/vendor/fflate/fflate-0.8.2.js");
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  try {
    async function participant(cookie) {
      const context = await browser.newContext();
      await context.addCookies(cookie.split("; ").map((pair) => {
        const index = pair.indexOf("=");
        return { name: pair.slice(0, index), value: pair.slice(index + 1), url: origin };
      }));
      const page = await context.newPage();
      page.on("dialog", (dialog) => void dialog.accept());
      page.setDefaultTimeout(15_000);
      return page;
    }

    const author = await participant(ownerCookie);
    const reviewer = await participant(reviewerCookie);
    const draft = {
      name: "Stage single post", caption: "Initial stage caption",
      brief: { textReviewed: true, photosCleared: true, slidesReviewed: true },
      slides: [{ id: "qa-cover", role: "cover", scene: "paper", template: "light-column", title: "SEKTA", body: "Stage export" }],
    };
    const shared = status(await request("/api/series", "POST", draft, ownerCookie), 201, "create shared browser draft");
    const editor = `${origin}/editor/postbuilder.html?team=${shared.id}`;
    await author.goto(editor);
    await author.getByText("Открыта общая версия", { exact: true }).waitFor();
    await author.locator("#carouselStageLongreadTab").click();
    await author.locator("#carouselCaption").fill("Caption saved by participant one");
    await author.getByText("Сохранено для команды", { exact: true }).waitFor();
    await reviewer.goto(editor);
    await reviewer.getByText("Открыта общая версия", { exact: true }).waitFor();
    await reviewer.locator("#carouselStageLongreadTab").click();
    assert.equal(await reviewer.locator("#carouselCaption").inputValue(), "Caption saved by participant one");
    await reviewer.locator("#teamCommentsPanel summary").click();
    await reviewer.locator("#teamMention").selectOption(ownerEmail);
    await reviewer.locator("#teamCommentBody").fill("Stage reviewer feedback");
    await reviewer.locator("#teamCommentSlide").click();
    await reviewer.locator("#teamCommentList").getByText("Stage reviewer feedback", { exact: true }).waitFor();
    await author.locator("#teamCommentsPanel summary").click();
    await author.locator("#teamCommentRefresh").click();
    await author.locator("#teamCommentList").getByText("Stage reviewer feedback", { exact: true }).waitFor();
    await author.locator("#carouselStageSlidesTab").click();
    const zip = author.waitForEvent("download");
    await author.locator("#carouselDownloadZip").click();
    const files = unzipSync(await readFile(await (await zip).path()));
    assert.equal(new TextDecoder().decode(files["caption.txt"]).trim(), "Caption saved by participant one");
    assert.equal(new DataView(files["01-cover.png"].buffer, files["01-cover.png"].byteOffset).getUint32(16), 1080);
    assert.equal(new DataView(files["01-cover.png"].buffer, files["01-cover.png"].byteOffset).getUint32(20), 1350);
    assert.ok(files["brief.txt"]);

    const formats = origin + "/editor/formats.html?kind=threads";
    await author.goto(formats);
    await author.locator("#threadsBank > summary").click();
    await author.locator("#themeSearch").fill("Весы испортили утро");
    const theme = author.locator("#threadsThemes article").filter({ hasText: "Весы испортили утро" });
    await theme.locator("summary").first().click();
    await theme.getByRole("button", { name: "В черновик" }).first().click();
    assert.match(await author.locator("#threadsBody").inputValue(), /вес/i);
    const week = await author.locator("#weekDate").inputValue();
    await author.locator("#publishDate").fill(week);
    await author.locator("#publishSlot").selectOption("morning");
    await author.locator("#saveDraft").click();
    await author.getByText("Черновик сохранён для команды.", { exact: true }).waitFor();
    await reviewer.goto(formats);
    await reviewer.locator("#threadsDesk > details").first().locator("summary").click();
    await reviewer.locator("#threadsCalendar").getByRole("button", { name: "Весы испортили утро" }).click();
    await reviewer.getByText("Открыт общий черновик.", { exact: true }).waitFor();
    assert.match(await reviewer.locator("#threadsBody").inputValue(), /вес/i);
    console.log("Two-browser acceptance passed: autosave, reviewer visibility and comment, ZIP dimensions and caption, Threads topic and shared calendar");
  } finally {
    await browser.close();
  }
}

status(await request("/api/members", "DELETE", { email: reviewerEmail }, ownerCookie), 200, "revoke reviewer");
status(await request("/api/series", "GET", undefined, reviewerCookie), 403, "revoked session blocked");
console.log("Acceptance passed: invitation, email verification, roles, revision conflict, review, history, revocation");
