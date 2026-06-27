import assert from "node:assert/strict";
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
