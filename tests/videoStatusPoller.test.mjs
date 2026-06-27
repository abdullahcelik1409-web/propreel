import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("video status poller prevents overlapping finalization requests", async () => {
  const source = await readFile(new URL("../components/VideoStatusPoller.jsx", import.meta.url), "utf8");

  assert.match(source, /if \(inFlight\.current\) return;/);
  assert.match(source, /inFlight\.current = true;/);
  assert.match(source, /finally\s*\{\s*inFlight\.current = false;/);
});
