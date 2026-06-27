import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getFfmpegPath } from "./ffmpegBinary.js";
import { normalizeAspectRatio } from "./videoConfig.js";
import { getReferenceOutputStrategy } from "./imageOrientation.js";

const VERTICAL_WIDTH = 1080;
const VERTICAL_HEIGHT = 1920;

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VISEO_SUPABASE_PROJECT_URL || "").replace(/\/$/, "");
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function getStorageObjectUrl(bucket, path, { publicUrl = false } = {}) {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) throw new Error("SUPABASE_URL is missing.");
  const safePath = String(path || "").split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/${publicUrl ? "object/public" : "object"}/${encodeURIComponent(bucket)}/${safePath}`;
}

export function getProviderAspectRatioForOutput(format, reference = {}) {
  if (normalizeAspectRatio(format) !== "9:16") return normalizeAspectRatio(format);
  if (!reference.orientation && !reference.width && !reference.height) return "16:9";
  return getReferenceOutputStrategy({ format, ...reference }).providerAspectRatio;
}

export function buildVerticalBlurCanvasFilterGraph({
  width = VERTICAL_WIDTH,
  height = VERTICAL_HEIGHT,
  cropVerticalSourceToLandscape = false,
} = {}) {
  const foregroundSource = cropVerticalSourceToLandscape
    ? `[0:v]crop=iw:iw*9/16:0:(ih-oh)/2,scale=${width}:${height}:force_original_aspect_ratio=decrease[fg]`
    : `[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease[fg]`;
  return [
    `[0:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},gblur=sigma=28[bg]`,
    foregroundSource,
    `[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1,setsar=1,fps=30,format=yuv420p[vout]`,
  ].join(";");
}

async function runFfmpeg(args) {
  const ffmpegPath = await getFfmpegPath({ purpose: "final vertical blur canvas" });
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg vertical canvas render failed with code ${code}: ${stderr.slice(-900)}`));
    });
  });
}

export async function renderVideoToVerticalBlurCanvas({ inputPath, outputPath, cropVerticalSourceToLandscape = false }) {
  await runFfmpeg([
    "-y", "-i", inputPath,
    "-filter_complex", buildVerticalBlurCanvasFilterGraph({ cropVerticalSourceToLandscape }),
    "-map", "[vout]", "-map", "0:a?",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
    outputPath,
  ]);
}

async function downloadVideo(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Vertical canvas source video download failed with status ${response.status}`);
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function uploadVideo({ inputPath, userId, videoId, storageFileName = "final-with-canvas.mp4" }) {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  const bucket = "media";
  const safeStorageFileName = String(storageFileName || "final-with-canvas.mp4")
    .split("/")
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "_"))
    .filter(Boolean)
    .join("/");
  const storagePath = `videos/${userId}/${videoId}/${safeStorageFileName}`;
  const response = await fetch(getStorageObjectUrl(bucket, storagePath), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "video/mp4",
      "x-upsert": "true",
    },
    body: await readFile(inputPath),
  });
  if (!response.ok) throw new Error(`Vertical canvas video upload failed with status ${response.status}`);
  return getStorageObjectUrl(bucket, storagePath, { publicUrl: true });
}

export async function addOutputCanvasToFinalVideo({
  video,
  sourceVideoUrl,
  cropVerticalSourceToLandscape = false,
  shouldApply,
  storageFileName,
  reason = null,
}) {
  const verticalOutput = normalizeAspectRatio(video?.format) === "9:16";
  const applyCanvas = verticalOutput && (typeof shouldApply === "boolean" ? shouldApply : true);
  if (!applyCanvas) {
    return { finalVideoUrl: sourceVideoUrl, applied: false, format: normalizeAspectRatio(video?.format) };
  }

  const workDir = join(tmpdir(), `viseo-canvas-${video.id || Date.now()}`);
  await mkdir(workDir, { recursive: true });
  try {
    const sourcePath = join(workDir, "source.mp4");
    const outputPath = join(workDir, "vertical-canvas.mp4");
    await downloadVideo(sourceVideoUrl, sourcePath);
    await renderVideoToVerticalBlurCanvas({ inputPath: sourcePath, outputPath, cropVerticalSourceToLandscape });
    return {
      finalVideoUrl: await uploadVideo({ inputPath: outputPath, userId: video.userId, videoId: video.id, storageFileName }),
      applied: true,
      format: "9:16",
      width: VERTICAL_WIDTH,
      height: VERTICAL_HEIGHT,
      background: "blur",
      foregroundAspectRatio: "16:9",
      reason,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => null);
  }
}
