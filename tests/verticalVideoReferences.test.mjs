import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import { buildPremiumProviderInput } from "../lib/premiumVideoCore.mjs";
import { normalizeAspectRatio } from "../lib/videoConfig.js";
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
        url: `https://cdn.example.com/processed-${index}.webp`,
        storagePath: `processed-video-references/vertical/user_1/job_1/${index}.webp`,
      };
    },
  });

  assert.equal(result.processed, true);
  assert.deepEqual(result.imageUrls, [
    "https://cdn.example.com/processed-0.webp",
    "https://cdn.example.com/processed-1.webp",
  ]);
  assert.deepEqual(calls.map((call) => call.index), [0, 1]);
  assert.match(calls[0].body, /vertical:https:\/\/cdn\.example\.com\/a\.jpg/);
});

test("transformImageToVerticalCanvas creates a 1080x1920 WebP", async () => {
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
  assert.equal(metadata.format, "webp");
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
