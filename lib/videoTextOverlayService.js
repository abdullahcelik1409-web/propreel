import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getFfmpegPath } from "./ffmpegBinary.js";

const VIDEO_DIMENSIONS = Object.freeze({
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 },
});

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

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Text overlay source video download failed with status ${response.status}`);
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function uploadVideo({ inputPath, userId, videoId }) {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  const bucket = "media";
  const storagePath = `videos/${userId}/${videoId}/final-with-text.mp4`;
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
  if (!response.ok) throw new Error(`Text overlay video upload failed with status ${response.status}`);
  return getStorageObjectUrl(bucket, storagePath, { publicUrl: true });
}

async function runFfmpeg(args) {
  const ffmpegPath = await getFfmpegPath({ purpose: "text overlay render" });
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg text overlay render failed with code ${code}: ${stderr.slice(-900)}`));
    });
  });
}

function escapeXml(value) {
  return String(value || "").replace(/[<>&"']/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
  })[character]);
}

function wrapText(value, maxCharacters) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function getStyleColors(styleVariant) {
  if (styleVariant === "elegant-minimal") return { accent: "#d9b76e", panelOpacity: 0.42 };
  if (styleVariant === "social-reel-cta") return { accent: "#8ee7d8", panelOpacity: 0.58 };
  return { accent: "#00fbfb", panelOpacity: 0.54 };
}

export function buildOverlaySvg(overlay, videoWidth) {
  const scale = Number(overlay.layout?.primaryScale || 1);
  const cardWidth = Math.round(videoWidth * Number(overlay.layout?.maxWidth || 64) / 100);
  const primaryFontSize = Math.max(38, Math.round(videoWidth * 0.047 * scale));
  const secondaryFontSize = Math.max(24, Math.round(primaryFontSize * 0.54));
  const horizontalPadding = Math.round(primaryFontSize * 0.55);
  const primaryLines = wrapText(overlay.primaryText, Math.max(18, Math.floor(cardWidth / (primaryFontSize * 0.56))));
  const secondaryLines = overlay.secondaryText ? wrapText(overlay.secondaryText, Math.max(24, Math.floor(cardWidth / (secondaryFontSize * 0.54)))) : [];
  const cardHeight = Math.round(
    horizontalPadding * 1.65 +
    primaryLines.length * primaryFontSize * 1.08 +
    secondaryLines.length * secondaryFontSize * 1.18 +
    (secondaryLines.length ? primaryFontSize * 0.28 : 0),
  );
  const colors = getStyleColors(overlay.styleVariant);
  const textAnchor = overlay.align === "center" ? "middle" : "start";
  const textX = overlay.align === "center" ? cardWidth / 2 : horizontalPadding;
  let cursorY = horizontalPadding + primaryFontSize;
  const primarySvg = primaryLines.map((line) => {
    const result = `<text x="${textX}" y="${cursorY}" text-anchor="${textAnchor}" font-family="Arial, Helvetica, sans-serif" font-size="${primaryFontSize}" font-weight="700" fill="#ffffff">${escapeXml(line)}</text>`;
    cursorY += primaryFontSize * 1.08;
    return result;
  }).join("");
  cursorY += secondaryLines.length ? primaryFontSize * 0.18 : 0;
  const secondarySvg = secondaryLines.map((line) => {
    const result = `<text x="${textX}" y="${cursorY}" text-anchor="${textAnchor}" font-family="Arial, Helvetica, sans-serif" font-size="${secondaryFontSize}" font-weight="500" fill="#e7eeee" fill-opacity=".88">${escapeXml(line)}</text>`;
    cursorY += secondaryFontSize * 1.18;
    return result;
  }).join("");
  const lineX = overlay.align === "center" ? cardWidth / 2 - primaryFontSize * 0.45 : horizontalPadding;

  return {
    width: cardWidth,
    height: cardHeight,
    svg: Buffer.from(`<svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="${Math.round(primaryFontSize * 0.25)}" fill="#031010" fill-opacity="${colors.panelOpacity}"/>
      <line x1="${lineX}" y1="${Math.round(horizontalPadding * 0.58)}" x2="${lineX + primaryFontSize * 0.9}" y2="${Math.round(horizontalPadding * 0.58)}" stroke="${colors.accent}" stroke-width="4" stroke-linecap="round"/>
      ${primarySvg}${secondarySvg}
    </svg>`),
  };
}

function getOverlayCoordinates(overlay, dimensions, card) {
  const xPercent = Number(overlay.layout?.xPercent || 7) / 100;
  const yPercent = Number(overlay.layout?.yPercent || 90) / 100;
  const x = overlay.layout?.anchorX === "center"
    ? Math.round(dimensions.width * xPercent - card.width / 2)
    : Math.round(dimensions.width * xPercent);
  let y = Math.round(dimensions.height * yPercent);
  if (overlay.layout?.anchorY === "bottom") y -= card.height;
  if (overlay.layout?.anchorY === "center") y -= Math.round(card.height / 2);
  return { x: Math.max(0, x), y: Math.max(0, y) };
}

export function buildOverlayFilterGraph(overlays, placements, dimensions = null, targetDuration = null) {
  const canvasFilter = dimensions
    ? `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2`
    : null;
  const durationFilter = Number.isFinite(Number(targetDuration)) && Number(targetDuration) > 0
    ? `tpad=stop_mode=clone:stop_duration=${Number(targetDuration)},trim=duration=${Number(targetDuration)},setpts=PTS-STARTPTS`
    : null;
  const baseFilters = [canvasFilter, "fps=30", durationFilter, "format=yuv420p"].filter(Boolean).join(",");
  const filters = [`[0:v]${baseFilters}[base]`];
  let baseLabel = "base";
  overlays.forEach((overlay, index) => {
    const inputIndex = index + 1;
    const fadeOutStart = Math.max(overlay.end - overlay.animationDurationOut, overlay.start).toFixed(3);
    const fadeInDuration = Math.max(overlay.animationDurationIn, 0.1).toFixed(3);
    const fadeOutDuration = Math.max(overlay.animationDurationOut, 0.1).toFixed(3);
    const preparedLabel = `overlay${index}`;
    const outputLabel = index === overlays.length - 1 ? "vout" : `stage${index}`;
    filters.push(`[${inputIndex}:v]format=rgba,fade=t=in:st=${overlay.start}:d=${fadeInDuration}:alpha=1,fade=t=out:st=${fadeOutStart}:d=${fadeOutDuration}:alpha=1[${preparedLabel}]`);
    filters.push(`[${baseLabel}][${preparedLabel}]overlay=x=${placements[index].x}:y=${placements[index].y}:enable='between(t,${overlay.start},${overlay.end})'[${outputLabel}]`);
    baseLabel = outputLabel;
  });
  return filters.join(";");
}

export function buildTextOverlayFallback(video, silentVideoUrl, error) {
  const errorMessage = String(error?.message || error || "Text overlay rendering failed").slice(0, 500);
  return {
    finalVideoUrl: silentVideoUrl,
    applied: false,
    failed: true,
    errorMessage,
    overlays: {
      ...video?.overlays,
      textOverlayStatus: "failed",
      textOverlayErrorMessage: errorMessage,
      final_video_without_text_url: silentVideoUrl,
    },
  };
}

export async function addTextOverlaysToFinalVideo({ video, silentVideoUrl }) {
  const plan = video?.overlays?.textOverlayPlan;
  if (!plan?.overlays?.length) {
    return { finalVideoUrl: silentVideoUrl, overlays: video.overlays, applied: false, failed: false };
  }

  const dimensions = VIDEO_DIMENSIONS[plan.aspectRatio] || VIDEO_DIMENSIONS["16:9"];
  const workDir = join(tmpdir(), `viseo-text-${video.id || Date.now()}`);
  try {
    await mkdir(workDir, { recursive: true });
    const { default: sharp } = await import("sharp");
    const sourcePath = join(workDir, "source.mp4");
    const outputPath = join(workDir, "with-text.mp4");
    await downloadFile(silentVideoUrl, sourcePath);
    const placements = [];
    const overlayPaths = [];

    for (let index = 0; index < plan.overlays.length; index += 1) {
      const overlay = plan.overlays[index];
      const card = buildOverlaySvg(overlay, dimensions.width);
      const overlayPath = join(workDir, `overlay-${index}.png`);
      await sharp(card.svg).png().toFile(overlayPath);
      overlayPaths.push(overlayPath);
      placements.push(getOverlayCoordinates(overlay, dimensions, card));
    }

    const inputArgs = overlayPaths.flatMap((overlayPath) => ["-loop", "1", "-framerate", "30", "-i", overlayPath]);
    const filterGraph = buildOverlayFilterGraph(plan.overlays, placements, dimensions, plan.duration);
    await runFfmpeg([
      "-y", "-i", sourcePath, ...inputArgs,
      "-filter_complex", filterGraph,
      "-map", "[vout]", "-an", "-t", String(plan.duration),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      outputPath,
    ]);

    const finalVideoUrl = await uploadVideo({ inputPath: outputPath, userId: video.userId, videoId: video.id });
    return {
      finalVideoUrl,
      applied: true,
      failed: false,
      overlays: {
        ...video.overlays,
        textOverlayStatus: "completed",
        final_video_without_text_url: silentVideoUrl,
        final_video_with_text_url: finalVideoUrl,
      },
    };
  } catch (error) {
    console.error("Text overlay rendering failed; provider video fallback will be used", {
      videoId: video?.id || null,
      error: error?.message || String(error),
    });
    return buildTextOverlayFallback(video, silentVideoUrl, error);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => null);
  }
}
