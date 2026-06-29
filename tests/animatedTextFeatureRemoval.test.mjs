import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const generateRouteUrl = new URL("../app/api/videos/generate/route.js", import.meta.url);
const statusRouteUrl = new URL("../app/api/videos/status/[jobId]/route.js", import.meta.url);

test("generate route ignores legacy animated text template inputs", async () => {
  const source = await readFile(generateRouteUrl, "utf8");
  assert.doesNotMatch(source, /buildOverlayPlan/);
  assert.doesNotMatch(source, /selectedTextTemplateId/);
  assert.doesNotMatch(source, /textOverlayPlan/);
  assert.doesNotMatch(source, /textOverlayStatus/);
});

test("status route finalizes videos without the animated text overlay service", async () => {
  const source = await readFile(statusRouteUrl, "utf8");
  assert.doesNotMatch(source, /addTextOverlaysToFinalVideo/);
  assert.match(source, /textOverlayFeatureRemoved:\s*true/);
  assert.match(source, /textOverlayStatus:\s*"disabled"/);
});
