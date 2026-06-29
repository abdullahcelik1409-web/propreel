import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const middlewareUrl = new URL("../middleware.js", import.meta.url);
const pageUrl = new URL("../app/demo/page.js", import.meta.url);
const clientUrl = new URL("../components/demo/DemoPageClient.jsx", import.meta.url);
const configUrl = new URL("../lib/marketing/demoConfig.js", import.meta.url);
const navUrl = new URL("../components/MarketingNav.jsx", import.meta.url);

test("/demo stays outside the auth-protected middleware matcher", async () => {
  const source = await readFile(middlewareUrl, "utf8");
  assert.match(source, /matcher:\s*\["\/dashboard\/:path\*", "\/admin\/:path\*", "\/auth\/:path\*"\]/);
  assert.doesNotMatch(source, /\/demo/);
});

test("demo page targets the existing register route and demo analytics events", async () => {
  const pageSource = await readFile(pageUrl, "utf8");
  const clientSource = await readFile(clientUrl, "utf8");
  const configSource = await readFile(configUrl, "utf8");
  const navSource = await readFile(navUrl, "utf8");
  assert.match(pageSource, /title: "Viseo Demo - AI Real Estate Video Examples"/);
  assert.match(pageSource, /const signUpHref = buildSignupUrl\(initialTrackingParams\)/);
  assert.match(pageSource, /<MarketingNav signUpHref=\{signUpHref\} \/>/);
  assert.match(clientSource, /Create your first listing video/);
  assert.match(clientSource, /Try Viseo/);
  assert.match(clientSource, /Transparency note/);
  assert.match(clientSource, /demo_page_view/);
  assert.match(clientSource, /demo_video_50/);
  assert.match(clientSource, /const completeTrackedRef = useRef\(false\)/);
  assert.match(clientSource, /if \(completeTrackedRef\.current\) return/);
  assert.match(clientSource, /completeTrackedRef\.current = true/);
  assert.match(clientSource, /demo_signup_click/);
  assert.match(clientSource, /object-cover lg:object-contain/);
  assert.match(navSource, /signUpHref = "\/auth\/register"/);
  assert.match(configSource, /\/auth\/register/);
});
