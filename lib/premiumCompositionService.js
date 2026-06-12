import { spawn } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mergeProviderVideoClips } from "./videoMergeService";
import { buildPremiumTransitionSummary, premiumVideoConfig } from "./premiumVideoCore.mjs";
import { fal } from "./fal";

async function getFfmpegPath() {
  try {
    const platform = `${process.platform}-${process.arch}`;
    const binary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    const ffmpegPath = join(process.cwd(), "node_modules", "@ffmpeg-installer", platform, binary);
    await access(ffmpegPath);
    return ffmpegPath;
  } catch (error) {
    throw new Error(`ffmpeg binary is not available for premium xfade composition: ${error?.message || error}`);
  }
}

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download premium video clip: ${response.status}`);
  }
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function runFfmpeg(args, { allowFailure = false } = {}) {
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
      else reject(new Error(`ffmpeg premium xfade failed with code ${code}: ${stderr.slice(-800)}`));
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
  return (hours * 3600) + (minutes * 60) + seconds;
}

function buildXfadeFilter(clipCount, durations, transitionSeconds) {
  const filters = [];
  const fallbackSceneDuration = premiumVideoConfig.targetDurationSeconds / Math.max(clipCount, 1);

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

async function mergePremiumVideoClipsWithXfade(videoUrls, { videoId, transitionSeconds = 0.4 } = {}) {
  if (!Array.isArray(videoUrls) || videoUrls.length < 2) return videoUrls?.[0] || null;

  const workDir = join(tmpdir(), `viseo-premium-${videoId || Date.now()}-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    const clipPaths = [];
    for (let index = 0; index < videoUrls.length; index += 1) {
      const clipPath = join(workDir, `clip-${index}.mp4`);
      await downloadFile(videoUrls[index], clipPath);
      clipPaths.push(clipPath);
    }

    const durations = await Promise.all(clipPaths.map((clipPath) => getVideoDurationSeconds(clipPath)));
    const outputPath = join(workDir, "premium-xfade-final.mp4");
    const { filter, outputLabel } = buildXfadeFilter(clipPaths.length, durations, transitionSeconds);
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
    ]);

    const bytes = await readFile(outputPath);
    const file = new File([bytes], `${videoId || "premium"}-xfade-final.mp4`, { type: "video/mp4" });
    return fal.storage.upload(file);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => null);
  }
}

export async function composePremiumVideoClips({
  jobId,
  generatedClips = [],
  scenePlan,
  transitionPlan,
  musicSelection = null,
  overlayData = null,
  mock = false,
} = {}) {
  const clipUrls = generatedClips.map((clip) => clip.videoUrl).filter(Boolean);
  const transitionSummary = transitionPlan || buildPremiumTransitionSummary(scenePlan);

  if (mock) {
    return {
      finalVideoUrl: `mock://premium/${jobId || "local"}/final/ultra-cinematic.mp4`,
      duration: premiumVideoConfig.targetDurationSeconds,
      transitionSummary,
      compositionMetadata: {
        provider: "mock",
        strategy: premiumVideoConfig.compositionStrategy,
        musicSelection,
        overlayData,
        generatedClips,
      },
    };
  }

  let finalVideoUrl = null;
  let xfadeApplied = false;
  let xfadeError = null;

  try {
    finalVideoUrl = await mergePremiumVideoClipsWithXfade(clipUrls, { videoId: jobId });
    xfadeApplied = clipUrls.length > 1;
  } catch (error) {
    xfadeError = error?.message || String(error);
    finalVideoUrl = await mergeProviderVideoClips(clipUrls, { videoId: jobId });
  }

  return {
    finalVideoUrl,
    duration: premiumVideoConfig.targetDurationSeconds,
    transitionSummary,
    compositionMetadata: {
      provider: premiumVideoConfig.provider,
      strategy: premiumVideoConfig.compositionStrategy,
      xfadeApplied,
      fallbackMergeUsed: Boolean(xfadeError),
      xfadeError,
      musicSelection,
      overlayData,
      generatedClips,
    },
  };
}
