import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";

import { buildOverlayFilterGraph, buildOverlaySvg, buildTextOverlayFallback, getOverlayCoordinates, normalizeOverlayForRender } from "../lib/videoTextOverlayService.js";
import { getFfmpegPath } from "../lib/ffmpegBinary.js";

const overlay = {
  start: 0.5,
  end: 6,
  primaryText: "Luxury 3-Bedroom Apartment",
  secondaryText: "Bebek, Istanbul",
  align: "left",
  animationDurationIn: 0.55,
  animationDurationOut: 0.45,
  styleVariant: "elegant-minimal",
  layout: { maxWidth: 58, primaryScale: 0.82 },
};

test("overlay SVG escapes property content and stays within ratio-aware width", () => {
  const card = buildOverlaySvg({ ...overlay, primaryText: "Villa & Residence" }, 1920);
  const svg = card.svg.toString();
  assert.equal(card.width, Math.round(1920 * 0.58));
  assert.match(svg, /Villa &amp; Residence/);
  assert.match(svg, /fill-opacity="0.42"/);
});

test("CTA card stays inside horizontal and vertical safe areas", () => {
  const cta = {
    ...overlay,
    isCta: true,
    primaryContentSlot: "cta",
    align: "center",
    layout: { maxWidth: 76, xPercent: 50, yPercent: 82, anchorX: "center", anchorY: "bottom", safeAreaX: 7, safeAreaY: 12 },
  };
  const card = buildOverlaySvg(cta, 1080);
  const placement = getOverlayCoordinates(cta, { width: 1080, height: 1920 }, card);
  assert.ok(placement.x >= Math.round(1080 * 0.07));
  assert.ok(placement.y >= Math.round(1920 * 0.12));
  assert.ok(placement.x + card.width <= 1080 - Math.round(1080 * 0.07));
  assert.ok(placement.y + card.height <= 1920 - Math.round(1920 * 0.12));
  assert.match(card.svg.toString(), /stroke-opacity="0.78"/);
});

test("legacy lower-center CTA plans are upgraded to current ratio safe areas", () => {
  const legacy = normalizeOverlayForRender({
    ...overlay,
    position: "lower-center",
    align: "center",
    layout: { maxWidth: 82, xPercent: 50, yPercent: 92, anchorX: "center", anchorY: "bottom", safeAreaX: 7, safeAreaY: 8 },
  }, "9:16");
  assert.equal(legacy.isCta, true);
  assert.equal(legacy.primaryContentSlot, "cta");
  assert.equal(legacy.layout.yPercent, 82);
  assert.equal(legacy.layout.maxWidth, 76);
  assert.equal(legacy.layout.safeAreaY, 12);
});

test("ffmpeg filter graph uses planned timing and alpha fades", () => {
  const graph = buildOverlayFilterGraph([overlay], [{ x: 120, y: 700 }], { width: 1920, height: 1080 }, 30);
  assert.match(graph, /scale=1920:1080:force_original_aspect_ratio=decrease/);
  assert.match(graph, /pad=1920:1080/);
  assert.match(graph, /tpad=stop_mode=clone:stop_duration=30/);
  assert.match(graph, /trim=duration=30/);
  assert.match(graph, /fade=t=in:st=0.5:d=0.550:alpha=1/);
  assert.match(graph, /fade=t=out:st=5.550:d=0.450:alpha=1/);
  assert.match(graph, /between\(t,0.5,6\)/);
  assert.match(graph, /overlay=x=120:y=700/);
});

test("text overlay failure preserves the provider video instead of leaving the job pending", () => {
  const fallback = buildTextOverlayFallback(
    { id: "video_1", overlays: { textOverlayPlan: { overlays: [overlay] } } },
    "https://cdn.example.com/provider-video.mp4",
    new Error("sharp native runtime missing"),
  );

  assert.equal(fallback.finalVideoUrl, "https://cdn.example.com/provider-video.mp4");
  assert.equal(fallback.applied, false);
  assert.equal(fallback.failed, true);
  assert.equal(fallback.overlays.textOverlayStatus, "failed");
  assert.match(fallback.overlays.textOverlayErrorMessage, /sharp native runtime missing/);
});

function runFfmpeg(ffmpegPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.slice(-900))));
  });
}

test("real ffmpeg binary renders the generated overlay graph on a synthetic local video", async () => {
  const ffmpegPath = await getFfmpegPath({ purpose: "text overlay integration test" });
  const workDir = join(tmpdir(), `viseo-overlay-test-${Date.now()}`);
  await mkdir(workDir, { recursive: true });
  try {
    const sourcePath = join(workDir, "source.mp4");
    const overlayPath = join(workDir, "overlay.png");
    const outputPath = join(workDir, "result.mp4");
    const integrationOverlay = { ...overlay, start: 0.35, end: 2.6 };
    const card = buildOverlaySvg(integrationOverlay, 640);
    await sharp(card.svg).png().toFile(overlayPath);
    await runFfmpeg(ffmpegPath, [
      "-y", "-f", "lavfi", "-i", "color=c=#0b1919:s=640x360:d=3:r=30",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", sourcePath,
    ]);
    const graph = buildOverlayFilterGraph([integrationOverlay], [{ x: 32, y: 170 }], { width: 640, height: 360 }, 3);
    await runFfmpeg(ffmpegPath, [
      "-y", "-i", sourcePath, "-loop", "1", "-framerate", "30", "-i", overlayPath,
      "-filter_complex", graph, "-map", "[vout]", "-an", "-t", "3",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", outputPath,
    ]);
    assert.ok((await readFile(outputPath)).byteLength > 1_000);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
