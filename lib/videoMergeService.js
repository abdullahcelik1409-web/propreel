import { spawn } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { fal } from "./fal";

async function getFfmpegPath() {
  try {
    const platform = `${process.platform}-${process.arch}`;
    const binary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    const ffmpegPath = join(process.cwd(), "node_modules", "@ffmpeg-installer", platform, binary);
    await access(ffmpegPath);
    return ffmpegPath;
  } catch (error) {
    throw new Error(`ffmpeg binary is not available for video merge: ${error?.message || error}`);
  }
}

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download provider video clip: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
}

async function runFfmpeg(args, { allowFailure = false, errorLabel = "ffmpeg merge" } = {}) {
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
      if (code === 0 || allowFailure) resolve({ code, stderr });
      else reject(new Error(`${errorLabel} failed with code ${code}: ${stderr.slice(-800)}`));
    });
  });
}

async function getVideoDurationSeconds(videoPath) {
  const result = await runFfmpeg(["-i", videoPath], { allowFailure: true });
  const match = result.stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const seconds = Number.parseFloat(match[3]);
  const duration = (hours * 3600) + (minutes * 60) + seconds;
  return Number.isFinite(duration) && duration > 0 ? duration : null;
}

function buildXfadeFilter(clipCount, durations, { transitionSeconds, targetDurationSeconds }) {
  const filters = [];
  const fallbackSceneDuration = targetDurationSeconds / Math.max(clipCount, 1);

  for (let index = 0; index < clipCount; index += 1) {
    filters.push(`[${index}:v]fps=30,format=yuv420p,settb=AVTB[v${index}]`);
  }

  let currentLabel = "v0";
  let accumulatedDuration = durations[0] || fallbackSceneDuration;

  for (let index = 1; index < clipCount; index += 1) {
    const nextLabel = index === clipCount - 1 ? "vxfade" : `x${index}`;
    const offset = Math.max(accumulatedDuration - transitionSeconds, 0.1).toFixed(3);
    filters.push(
      `[${currentLabel}][v${index}]xfade=transition=fade:duration=${transitionSeconds}:offset=${offset}[${nextLabel}]`,
    );
    currentLabel = nextLabel;
    accumulatedDuration += (durations[index] || fallbackSceneDuration) - transitionSeconds;
  }

  return {
    filter: filters.join(";"),
    outputLabel: currentLabel,
  };
}

export async function mergeProviderVideoClips(videoUrls, { videoId }) {
  if (!Array.isArray(videoUrls) || videoUrls.length < 2) return videoUrls?.[0] || null;

  const workDir = join(tmpdir(), `viseo-${videoId || Date.now()}-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    const clipPaths = [];
    for (let index = 0; index < videoUrls.length; index += 1) {
      const clipPath = join(workDir, `clip-${index}.mp4`);
      await downloadFile(videoUrls[index], clipPath);
      clipPaths.push(clipPath);
    }

    const listPath = join(workDir, "clips.txt");
    const concatList = clipPaths
      .map((path) => `file '${path.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`)
      .join("\n");
    await writeFile(listPath, concatList);

    const outputPath = join(workDir, "final.mp4");
    await runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outputPath]);

    const bytes = await readFile(outputPath);
    const file = new File([bytes], `${videoId || "multi-image"}-final.mp4`, { type: "video/mp4" });
    return fal.storage.upload(file);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => null);
  }
}

export async function mergeProviderVideoClipsWithXfade(videoUrls, {
  videoId,
  transitionSeconds = 0.4,
  targetDurationSeconds = 60,
  filePrefix = "video",
} = {}) {
  if (!Array.isArray(videoUrls) || videoUrls.length < 2) return videoUrls?.[0] || null;

  const workDir = join(tmpdir(), `viseo-xfade-${videoId || Date.now()}-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    const clipPaths = [];
    for (let index = 0; index < videoUrls.length; index += 1) {
      const clipPath = join(workDir, `clip-${index}.mp4`);
      await downloadFile(videoUrls[index], clipPath);
      clipPaths.push(clipPath);
    }

    const durations = await Promise.all(clipPaths.map((clipPath) => getVideoDurationSeconds(clipPath)));
    const outputPath = join(workDir, "xfade-final.mp4");
    const { filter, outputLabel } = buildXfadeFilter(clipPaths.length, durations, {
      transitionSeconds,
      targetDurationSeconds,
    });
    const inputArgs = clipPaths.flatMap((clipPath) => ["-i", clipPath]);

    await runFfmpeg([
      "-y",
      ...inputArgs,
      "-filter_complex",
      filter,
      "-map",
      `[${outputLabel}]`,
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath,
    ], { errorLabel: "ffmpeg xfade merge" });

    const bytes = await readFile(outputPath);
    const file = new File([bytes], `${videoId || filePrefix}-xfade-final.mp4`, { type: "video/mp4" });
    return fal.storage.upload(file);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => null);
  }
}

export async function mergeProviderVideoClipsWithXfadeFallback(videoUrls, options = {}) {
  if (!Array.isArray(videoUrls) || videoUrls.length < 2) {
    return {
      finalVideoUrl: videoUrls?.[0] || null,
      xfadeApplied: false,
      fallbackMergeUsed: false,
      xfadeError: null,
    };
  }

  try {
    const finalVideoUrl = await mergeProviderVideoClipsWithXfade(videoUrls, options);
    return {
      finalVideoUrl,
      xfadeApplied: true,
      fallbackMergeUsed: false,
      xfadeError: null,
    };
  } catch (error) {
    const finalVideoUrl = await mergeProviderVideoClips(videoUrls, options);
    return {
      finalVideoUrl,
      xfadeApplied: false,
      fallbackMergeUsed: true,
      xfadeError: error?.message || String(error),
    };
  }
}
