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

test("VideoGeneratorForm imports every duration planner used by interactive video modes", async () => {
  const source = await readFile(componentUrl, "utf8");
  const videoConfigImports = getNamedImports(source, "@/lib/videoConfig");

  for (const plannerName of ["getMultiImageScenePlan", "getPremiumDurationPlan"]) {
    assert.match(source, new RegExp(`\\b${plannerName}\\s*\\(`), `${plannerName} must be used by the form`);
    assert.ok(videoConfigImports.has(plannerName), `${plannerName} must be imported before its mode can render`);
  }
});
