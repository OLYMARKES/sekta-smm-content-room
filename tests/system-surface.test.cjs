const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const inventory = JSON.parse(fs.readFileSync(path.join(root, "docs/system-surface.json"), "utf8"));

test("system surface inventory is complete and matches the mounted shell", () => {
  assert.equal(inventory.schema, "sekta-system-surface");
  assert.equal(inventory.version, 1);
  assert.match(inventory.currentBaseline, /^[0-9a-f]{40}$/);
  assert.match(inventory.lastFullInterface, /^[0-9a-f]{40}$/);
  assert.match(inventory.collapseCommit, /^[0-9a-f]{40}$/);

  const ids = inventory.sections.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length, "section ids must be unique");

  const expectedMountedIds = inventory.sections
    .filter((section) => section.status === "active" || section.status === "partial")
    .map((section) => section.id)
    .sort();
  const mountedNavigationIds = [...html.matchAll(/class="[^"]*\bnav-item\b[^"]*"[^>]*data-view="([^"]+)"/g)]
    .map((match) => match[1])
    .sort();
  assert.deepEqual(mountedNavigationIds, expectedMountedIds, "navigation and inventory must describe the same mounted rooms");

  for (const section of inventory.sections) {
    assert(["active", "partial", "source-only"].includes(section.status), `${section.id}: unknown status`);
    assert(section.decision, `${section.id}: recovery decision is missing`);

    const hasPanel = html.includes(`data-view-panel="${section.id}"`);
    const hasNavigation = html.includes(`data-view="${section.id}"`);

    if (section.status === "active" || section.status === "partial") {
      assert(hasPanel, `${section.id}: inventory says mounted, but its panel is missing`);
      assert(hasNavigation, `${section.id}: inventory says mounted, but its navigation item is missing`);
    } else {
      assert(!hasPanel, `${section.id}: panel was restored; update the inventory status`);
      assert(!hasNavigation, `${section.id}: navigation was restored; update the inventory status`);
    }

    for (const filename of section.sourceFiles || []) {
      assert(fs.existsSync(path.join(root, filename)), `${section.id}: recovery source is missing: ${filename}`);
    }
  }
});
