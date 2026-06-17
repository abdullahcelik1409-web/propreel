import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalizeAspectRatio } from "./videoConfig.js";

const VERTICAL_CANVAS_WIDTH = 1080;
const VERTICAL_CANVAS_HEIGHT = 1920;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 15000;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PROCESSED_IMAGE_CONTENT_TYPE = "image/jpeg";
const PROCESSED_IMAGE_EXTENSION = "jpg";

async function getFfmpegPath() {
  try {
    const platform = `${process.platform}-${process.arch}`;
    const binary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    const ffmpegPath = join(process.cwd(), "node_modules", "@ffmpeg-installer", platform, binary);
    await access(ffmpegPath);
    return ffmpegPath;
  } catch (error) {
    throw new Error(`ffmpeg binary is not available for vertical image preprocessing: ${error?.message || error}`);
  }
}

async function runFfmpeg(args, { errorLabel = "ffmpeg image transform" } = {}) {
  const ffmpegPath = await getFfmpegPath();
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stderr);
      else reject(new Error(`${errorLabel} failed with code ${code}: ${stderr.slice(-800)}`));
    });
  });
}

function detectImageExtension(imageBuffer) {
  if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length < 12) {
    throw new Error("image buffer is missing or too small");
  }

  if (imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8 && imageBuffer[2] === 0xff) {
    return "jpg";
  }

  if (
    imageBuffer[0] === 0x89 &&
    imageBuffer[1] === 0x50 &&
    imageBuffer[2] === 0x4e &&
    imageBuffer[3] === 0x47
  ) {
    return "png";
  }

  if (
    imageBuffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    imageBuffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  throw new Error("unsupported image buffer format");
}

function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VISEO_SUPABASE_PROJECT_URL ||
    ""
  ).replace(/\/$/, "");
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function getStorageObjectUrl(bucket, path, { publicUrl = false } = {}) {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) throw new Error("SUPABASE_URL is missing.");
  const safePath = String(path || "").split("/").map(encodeURIComponent).join("/");
  const base = publicUrl ? "object/public" : "object";
  return `${supabaseUrl}/storage/v1/${base}/${encodeURIComponent(bucket)}/${safePath}`;
}

function createPreprocessingError(message, cause) {
  const error = new Error("We couldn't prepare your images for vertical video. Please try again or upload another image.");
  error.status = 400;
  error.code = "VERTICAL_REFERENCE_PREPROCESSING_FAILED";
  error.details = message;
  error.cause = cause;
  return error;
}

export function isVerticalVideoFormat(format) {
  return normalizeAspectRatio(format) === "9:16";
}

async function downloadImageBuffer(imageUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`image download failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type")?.split(";")[0]?.toLowerCase();
    if (!contentType || !SUPPORTED_IMAGE_TYPES.has(contentType)) {
      throw new Error(`unsupported image content type: ${contentType || "unknown"}`);
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES) {
      throw new Error(`image is too large: ${contentLength} bytes`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new Error(`image is too large after download: ${buffer.length} bytes`);
    }

    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

export async function transformImageToVerticalCanvas(imageBuffer, {
  canvasWidth = VERTICAL_CANVAS_WIDTH,
  canvasHeight = VERTICAL_CANVAS_HEIGHT,
} = {}) {
  const workDir = join(tmpdir(), `viseo-image-${Date.now()}-${randomUUID()}`);
  try {
    const inputExtension = detectImageExtension(imageBuffer);
    const inputPath = join(workDir, `source.${inputExtension}`);
    const outputPath = join(workDir, `vertical.${PROCESSED_IMAGE_EXTENSION}`);
    const filterGraph = [
      `[0:v]scale=${canvasWidth}:${canvasHeight}:force_original_aspect_ratio=increase,crop=${canvasWidth}:${canvasHeight},gblur=sigma=24[bg]`,
      `[0:v]scale=${canvasWidth}:${canvasHeight}:force_original_aspect_ratio=decrease[fg]`,
      `[bg][fg]overlay=(W-w)/2:(H-h)/2[out]`,
    ].join(";");

    await mkdir(workDir, { recursive: true });
    await writeFile(inputPath, imageBuffer);
    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-filter_complex",
      filterGraph,
      "-map",
      "[out]",
      "-frames:v",
      "1",
      "-q:v",
      "2",
      outputPath,
    ]);

    return await readFile(outputPath);
  } catch (error) {
    throw new Error(`image transform failed: ${error?.message || error}`);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => null);
  }
}

export async function uploadProcessedReferenceImage({ imageBuffer, userId, jobId, index }) {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");

  const bucket = "media";
  const safeUserId = String(userId || "anonymous").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeJobId = String(jobId || randomUUID()).replace(/[^a-zA-Z0-9_-]/g, "_");
  const storagePath = `processed-video-references/vertical/${safeUserId}/${safeJobId}/${Date.now()}-${index}.${PROCESSED_IMAGE_EXTENSION}`;
  const uploadUrl = getStorageObjectUrl(bucket, storagePath);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": PROCESSED_IMAGE_CONTENT_TYPE,
      "Content-Length": String(imageBuffer.length),
      "x-upsert": "true",
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`storage upload failed with status ${response.status}${details ? `: ${details.slice(0, 240)}` : ""}`);
  }

  return {
    url: getStorageObjectUrl(bucket, storagePath, { publicUrl: true }),
    storagePath,
  };
}

export async function prepareReferenceImagesForVideo({
  imageUrls = [],
  format,
  userId,
  jobId,
  downloadImage = downloadImageBuffer,
  transformImage = transformImageToVerticalCanvas,
  uploadImage = uploadProcessedReferenceImage,
} = {}) {
  const normalizedFormat = normalizeAspectRatio(format);
  const urls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];

  if (!isVerticalVideoFormat(normalizedFormat)) {
    return {
      format: normalizedFormat,
      processed: false,
      imageUrls: urls,
      references: urls.map((url, index) => ({ index, originalUrl: url, processedUrl: url, processed: false })),
    };
  }

  try {
    const processedReferences = [];
    const cache = new Map();

    for (let index = 0; index < urls.length; index += 1) {
      const originalUrl = urls[index];
      if (cache.has(originalUrl)) {
        const cached = cache.get(originalUrl);
        processedReferences.push({ ...cached, index });
        continue;
      }

      const originalBuffer = await downloadImage(originalUrl, { index });
      const transformedBuffer = await transformImage(originalBuffer, { index });
      const uploaded = await uploadImage({ imageBuffer: transformedBuffer, userId, jobId, index, originalUrl });
      const reference = {
        index,
        originalUrl,
        processedUrl: uploaded.url,
        storagePath: uploaded.storagePath,
        processed: true,
      };
      cache.set(originalUrl, reference);
      processedReferences.push(reference);
    }

    return {
      format: normalizedFormat,
      processed: true,
      imageUrls: processedReferences.map((reference) => reference.processedUrl),
      references: processedReferences,
    };
  } catch (error) {
    console.error("Vertical reference image preprocessing failed", {
      message: error?.message || String(error),
      userId,
      jobId,
      imageCount: urls.length,
    });
    throw createPreprocessingError(error?.message || "vertical preprocessing failed", error);
  }
}
