import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import sharp from "sharp";

import { getFfmpegPath } from "../lib/ffmpegBinary.js";
import { renderVideoToVerticalBlurCanvas } from "../lib/videoCanvasService.js";

function runFfmpeg(ffmpegPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.slice(-900))));
  });
}

test("horizontal provider video is rendered onto a real 1080x1920 blur canvas", async () => {
  const ffmpegPath = await getFfmpegPath({ purpose: "vertical canvas integration test" });
  const workDir = join(tmpdir(), `viseo-canvas-test-${Date.now()}`);
  await mkdir(workDir, { recursive: true });
  try {
    const sourcePath = join(workDir, "source.mp4");
    const outputPath = join(workDir, "vertical.mp4");
    const framePath = join(workDir, "frame.jpg");
    await runFfmpeg(ffmpegPath, [
      "-y", "-f", "lavfi", "-i", "testsrc2=s=640x360:d=1:r=24",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", sourcePath,
    ]);
    await renderVideoToVerticalBlurCanvas({ inputPath: sourcePath, outputPath });
    await runFfmpeg(ffmpegPath, ["-y", "-ss", "0.4", "-i", outputPath, "-frames:v", "1", framePath]);

    const metadata = await sharp(await readFile(framePath)).metadata();
    assert.equal(metadata.width, 1080);
    assert.equal(metadata.height, 1920);
    assert.ok((await readFile(outputPath)).byteLength > 10_000);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
