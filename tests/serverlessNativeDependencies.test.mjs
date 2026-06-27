import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import createNextConfig from "../next.config.mjs";

test("video status functions trace Sharp and libvips Linux runtime files", () => {
  const config = createNextConfig("phase-production-build");
  const includes = config.outputFileTracingIncludes?.["/api/videos/**/*"] || [];

  for (const requiredPattern of [
    "./node_modules/sharp/**/*",
    "./node_modules/@img/sharp-linux-x64/**/*",
    "./node_modules/@img/sharp-libvips-linux-x64/**/*",
  ]) {
    assert.ok(includes.includes(requiredPattern), `${requiredPattern} must be included in the serverless trace`);
  }
});

test("video status finalization has enough Vercel runtime for FFmpeg post-processing", async () => {
  const vercelConfig = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const maxDuration = vercelConfig.functions?.["app/api/videos/status/[jobId]/route.js"]?.maxDuration;

  assert.ok(maxDuration >= 120, `video status maxDuration must cover FFmpeg finalization, received ${maxDuration}`);
});
