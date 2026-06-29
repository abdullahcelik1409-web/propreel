import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const builderUrl = new URL("../components/AdminDemoLinkBuilder.jsx", import.meta.url);
const tabsUrl = new URL("../components/AdminDashboardTabs.jsx", import.meta.url);
const adminPageUrl = new URL("../app/admin/page.js", import.meta.url);

test("admin dashboard exposes the protected demo link builder tab", async () => {
  const [builderSource, tabsSource, adminPageSource] = await Promise.all([
    readFile(builderUrl, "utf8"),
    readFile(tabsUrl, "utf8"),
    readFile(adminPageUrl, "utf8"),
  ]);

  assert.match(adminPageSource, /await requireAdmin\(\)/);
  assert.match(tabsSource, /AdminDemoLinkBuilder/);
  assert.match(tabsSource, /Demo Links/);
  assert.match(builderSource, /buildDemoUrl\(values\)/);
  assert.match(builderSource, /UTM Source/);
  assert.match(builderSource, /UTM Medium/);
  assert.match(builderSource, /UTM Campaign/);
  assert.match(builderSource, /Recipient ID/);
  assert.match(builderSource, /Generate ID/);
  assert.match(builderSource, /Copy URL/);
  assert.match(builderSource, /Open demo/);
  assert.match(builderSource, /navigator\.clipboard\.writeText\(generatedUrl\)/);
});
