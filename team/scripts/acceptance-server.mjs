// Run inside an isolated Content Room container with a disposable DB and Mailpit.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

const origin = "http://127.0.0.1:3000";
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
status(await request("/api/members", "DELETE", { email: reviewerEmail }, ownerCookie), 200, "revoke reviewer");
status(await request("/api/series", "GET", undefined, reviewerCookie), 403, "revoked session blocked");
console.log("Acceptance passed: invitation, email verification, roles, revision conflict, review, history, revocation");
