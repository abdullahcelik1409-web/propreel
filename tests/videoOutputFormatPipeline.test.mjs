import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("all Fal generation modes separate provider ratio from guaranteed final output ratio", async () => {
  const generateSource = await readFile(new URL("../app/api/videos/generate/route.js", import.meta.url), "utf8");
  const statusSource = await readFile(new URL("../app/api/videos/status/[jobId]/route.js", import.meta.url), "utf8");
  const multiSource = await readFile(new URL("../lib/falVideoService.js", import.meta.url), "utf8");
  const premiumSource = await readFile(new URL("../lib/premiumVideoProvider.js", import.meta.url), "utf8");
  const mergeSource = await readFile(new URL("../lib/videoMergeService.js", import.meta.url), "utf8");

  assert.match(generateSource, /referenceStrategy\?\.providerAspectRatio \|\| format/);
  assert.match(generateSource, /referenceImages: referencePreparation\.references/);
  assert.match(generateSource, /providerAspectRatio: requiresVerticalCanvas \? "16:9" : referencePreparation\?\.format/);
  assert.match(generateSource, /scenePlan: providerScenePlan/);
  assert.match(multiSource, /const clipAspectRatio = reference\?\.providerAspectRatio/);
  assert.match(multiSource, /requiresVerticalCanvas,/);
  assert.match(premiumSource, /aspectRatio: scene\.providerAspectRatio \|\| aspectRatio/);
  assert.match(statusSource, /applyRequiredCanvasToProviderClips/);
  assert.match(statusSource, /shouldApply: Boolean\(request\.requiresVerticalCanvas\)/);
  assert.match(statusSource, /silentVideoUrl: mergeResult\.finalVideoUrl/);
  assert.match(mergeSource, /force_original_aspect_ratio=decrease,pad=/);
  assert.match(mergeSource, /concat=n=\$\{clipPaths\.length\}:v=1:a=0/);
});
