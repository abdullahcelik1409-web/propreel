import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentUrl = new URL("../components/VideoGeneratorForm.jsx", import.meta.url);

function getNamedImports(source, moduleName) {
  const escapedModuleName = moduleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`import\\s*\\{([\\s\\S]*?)\\}\\s*from\\s*["']${escapedModuleName}["']`));

  assert.ok(match, `${moduleName} named import block must exist`);

  return new Set(
    match[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

test("VideoGeneratorForm imports the premium duration planner used by the premium flow", async () => {
  const source = await readFile(componentUrl, "utf8");
  const videoConfigImports = getNamedImports(source, "@/lib/videoConfig");

  assert.match(source, /\bgetPremiumDurationPlan\s*\(/, "getPremiumDurationPlan must be used by the form");
  assert.ok(videoConfigImports.has("getPremiumDurationPlan"), "getPremiumDurationPlan must be imported before its mode can render");
});

test("VideoGeneratorForm no longer renders animated text style controls", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.doesNotMatch(source, /TextTemplateSelector/);
  assert.doesNotMatch(source, /selectedTextTemplateId/);
  assert.doesNotMatch(source, /Text style/);
});

test("vertical format shows the Magic-inspired photo compatibility analyzer", async () => {
  const source = await readFile(componentUrl, "utf8");
  assert.match(source, /import VerticalPhotoCompatibility from "@\/components\/video\/VerticalPhotoCompatibility"/);
  assert.match(source, /format === "9:16"/);
  assert.match(source, /<VerticalPhotoCompatibility imageUrls=\{verticalPreviewImageUrls\}/);
});
