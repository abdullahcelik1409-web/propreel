import { fal } from "../../../lib/fal.js";
import { generateVideoFromImages } from "../../../lib/falVideoService.js";

function disabled(feature) {
  return new Error(`${feature} is disabled in Part 1. Fal model mapping will be added in Part 2.`);
}

export async function uploadFile(_apiKey, file, onProgress) {
  if (!file) throw new Error("No file selected.");
  onProgress?.(10);
  const url = await fal.storage.upload(file);
  onProgress?.(100);
  return url;
}

export async function generateImage() {
  throw disabled("Image generation");
}

export async function generateI2I() {
  throw disabled("Image-to-image generation");
}

export async function generateVideo() {
  throw disabled("Text-to-video generation");
}

export async function generateI2V(_apiKey, params) {
  const images = [params?.image_url].filter(Boolean);
  return generateVideoFromImages(images, {
    prompt: params?.prompt,
    aspect_ratio: params?.aspect_ratio,
    duration: params?.duration,
    resolution: params?.resolution,
    seed: params?.seed,
    onRequestId: params?.onRequestId,
  });
}

export async function processV2V() {
  throw disabled("Video-to-video generation");
}
