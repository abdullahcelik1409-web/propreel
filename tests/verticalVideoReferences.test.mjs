import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import { buildPremiumProviderInput } from "../lib/premiumVideoCore.mjs";
import { normalizeAspectRatio } from "../lib/videoConfig.js";
import { buildVerticalBlurCanvasFilterGraph, getProviderAspectRatioForOutput } from "../lib/videoCanvasService.js";
import {
  prepareReferenceImagesForVideo,
  transformImageToVerticalCanvas,
} from "../lib/videoReferenceImageService.js";

test("normalizeAspectRatio accepts vertical aliases", () => {
  assert.equal(normalizeAspectRatio("9:16"), "9:16");
  assert.equal(normalizeAspectRatio("vertical"), "9:16");
  assert.equal(normalizeAspectRatio("portrait"), "9:16");
  assert.equal(normalizeAspectRatio("16:9"), "16:9");
});

test("vertical output is generated horizontally before the app applies its guaranteed blur canvas", () => {
  assert.equal(getProviderAspectRatioForOutput("9:16"), "16:9");
  assert.equal(getProviderAspectRatioForOutput("16:9"), "16:9");
  assert.equal(getProviderAspectRatioForOutput("1:1"), "1:1");

  const graph = buildVerticalBlurCanvasFilterGraph();
  assert.match(graph, /scale=1080:1920:force_original_aspect_ratio=increase/);
  assert.match(graph, /gblur=sigma=28/);
  assert.match(graph, /scale=1080:1920:force_original_aspect_ratio=decrease/);
  assert.match(graph, /overlay=\(W-w\)\/2:\(H-h\)\/2/);

  const recoveryGraph = buildVerticalBlurCanvasFilterGraph({ cropVerticalSourceToLandscape: true });
  assert.match(recoveryGraph, /crop=iw:iw\*9\/16:0:\(ih-oh\)\/2/);
});

test("horizontal format keeps original image URLs without preprocessing", async () => {
  const imageUrls = ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"];
  const result = await prepareReferenceImagesForVideo({
    imageUrls,
    format: "16:9",
    downloadImage: async () => {
      throw new Error("download should not run for horizontal format");
    },
  });

  assert.equal(result.processed, false);
  assert.deepEqual(result.imageUrls, imageUrls);
});

test("vertical format returns processed URLs in the original order", async () => {
  const calls = [];
  const result = await prepareReferenceImagesForVideo({
    imageUrls: ["https://cdn.example.com/a.jpg", "https://cdn.example.com/b.jpg"],
    format: "9:16",
    userId: "user_1",
    jobId: "job_1",
    downloadImage: async (url) => Buffer.from(url),
    transformImage: async (buffer) => Buffer.from(`vertical:${buffer.toString()}`),
    uploadImage: async ({ imageBuffer, index }) => {
      calls.push({ index, body: imageBuffer.toString() });
      return {
        url: `https://cdn.example.com/processed-${index}.jpg`,
        storagePath: `processed-video-references/vertical/user_1/job_1/${index}.jpg`,
      };
    },
  });

  assert.equal(result.processed, true);
  assert.deepEqual(result.imageUrls, [
    "https://cdn.example.com/processed-0.jpg",
    "https://cdn.example.com/processed-1.jpg",
  ]);
  assert.deepEqual(calls.map((call) => call.index), [0, 1]);
  assert.match(calls[0].body, /vertical:https:\/\/cdn\.example\.com\/a\.jpg/);
});

test("transformImageToVerticalCanvas creates a 1080x1920 JPEG", async () => {
  const input = await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 3,
      background: "#d9d2c3",
    },
  }).jpeg().toBuffer();

  const output = await transformImageToVerticalCanvas(input);
  const metadata = await sharp(output).metadata();

  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 1920);
  assert.equal(metadata.format, "jpeg");
});

test("transformImageToVerticalCanvas accepts WebP input", async () => {
  const input = await sharp({
    create: {
      width: 900,
      height: 1400,
      channels: 3,
      background: "#7dc4d2",
    },
  }).webp().toBuffer();

  const output = await transformImageToVerticalCanvas(input);
  const metadata = await sharp(output).metadata();

  assert.equal(metadata.width, 1080);
  assert.equal(metadata.height, 1920);
  assert.equal(metadata.format, "jpeg");
});

test("Kling 3 premium payload carries processed images and vertical aspect ratio", () => {
  const input = buildPremiumProviderInput({
    scene: {
      prompt: "Premium scene",
      sourcePhotoUrl: "https://cdn.example.com/source.jpg",
      targetPhotoUrl: "https://cdn.example.com/target.jpg",
      targetDuration: 6,
      negativePrompt: "blur",
    },
    startFrameUrl: "https://cdn.example.com/processed-source.jpg",
    aspectRatio: "9:16",
  });

  assert.equal(input.start_image_url, "https://cdn.example.com/processed-source.jpg");
  assert.equal(input.end_image_url, "https://cdn.example.com/target.jpg");
  assert.equal(input.aspect_ratio, "9:16");
});
