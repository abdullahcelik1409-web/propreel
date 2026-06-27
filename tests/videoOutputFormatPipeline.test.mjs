import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("all Fal generation modes separate provider ratio from guaranteed final output ratio", async () => {
  const generateSource = await readFile(new URL("../app/api/videos/generate/route.js", import.meta.url), "utf8");
  const statusSource = await readFile(new URL("../app/api/videos/status/[jobId]/route.js", import.meta.url), "utf8");

  assert.match(generateSource, /const providerAspectRatio = getProviderAspectRatioForOutput\(format\)/);
  assert.ok((generateSource.match(/aspectRatio: providerAspectRatio/g) || []).length >= 3);
  assert.ok((generateSource.match(/format: providerAspectRatio/g) || []).length >= 3);
  assert.ok((statusSource.match(/addOutputCanvasToFinalVideo\(/g) || []).length >= 3);
});
