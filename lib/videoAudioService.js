import { spawn } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  getAudioMetadata,
  mergeAudioMetadataIntoOverlays,
  normalizeAudioTrackId,
} from "./audioConfig";
import { getAudioTrackById } from "./audioTrackService";

const AUDIO_VOLUME = 0.18;

function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.PROPREEL_SUPABASE_PROJECT_URL ||
    ""
  ).replace(/\/$/, "");
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

async function getFfmpegPath() {
  try {
    const platform = `${process.platform}-${process.arch}`;
    const binary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    const ffmpegPath = join(process.cwd(), "node_modules", "@ffmpeg-installer", platform, binary);
    await access(ffmpegPath);
    return ffmpegPath;
  } catch (error) {
    throw new Error(`ffmpeg binary is not available for audio merge: ${error?.message || error}`);
  }
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
      if (code === 0 || allowFailure) resolve(stderr);
      else reject(new Error(`ffmpeg audio merge failed with code ${code}: ${stderr.slice(-600)}`));
    });
  });
}

async function downloadFile(url, outputPath, headers = {}) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`File download failed with status ${response.status}`);
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function getVideoDurationSeconds(videoPath) {
  const stderr = await runFfmpeg(["-i", videoPath], { allowFailure: true });
  const match = stderr.match(/Duration:\s+(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
  if (!match) return 10;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const duration = hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(duration) && duration > 0 ? duration : 10;
}

function getStorageObjectUrl(bucket, path, { publicUrl = false } = {}) {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) throw new Error("SUPABASE_URL is missing.");
  const safePath = String(path || "").split("/").map(encodeURIComponent).join("/");
  const base = publicUrl ? "object/public" : "object";
  return `${supabaseUrl}/storage/v1/${base}/${encodeURIComponent(bucket)}/${safePath}`;
}

async function downloadAudioTrack(track, outputPath) {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const headers = serviceRoleKey
    ? { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey }
    : {};
  const url = getStorageObjectUrl(track.storage_bucket, track.storage_path, { publicUrl: !serviceRoleKey });
  await downloadFile(url, outputPath, headers);
}

async function uploadVideoToSupabase({ inputPath, userId, videoId }) {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const supabaseUrl = getSupabaseUrl();

  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  if (!supabaseUrl) throw new Error("SUPABASE_URL is missing.");

  const bucket = "media";
  const storagePath = `videos/${userId}/${videoId}/final-with-audio.mp4`;
  const uploadUrl = getStorageObjectUrl(bucket, storagePath);
  const bytes = await readFile(inputPath);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "video/mp4",
      "x-upsert": "true",
    },
    body: bytes,
  });

  if (!response.ok) throw new Error(`Supabase video upload failed with status ${response.status}`);
  return getStorageObjectUrl(bucket, storagePath, { publicUrl: true });
}

async function runAudioMerge({ videoPath, audioPath, outputPath, durationSeconds }) {
  const fadeOutStart = Math.max(durationSeconds - 1, 0).toFixed(2);
  const filter = `[1:a]volume=${AUDIO_VOLUME},afade=t=in:st=0:d=1,afade=t=out:st=${fadeOutStart}:d=1[a]`;
  const commonArgs = [
    "-y",
    "-i",
    videoPath,
    "-i",
    audioPath,
    "-filter_complex",
    filter,
    "-map",
    "0:v:0",
    "-map",
    "[a]",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-shortest",
  ];

  try {
    await runFfmpeg([...commonArgs, "-c:v", "copy", outputPath]);
  } catch {
    await runFfmpeg([
      ...commonArgs,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "18",
      outputPath,
    ]);
  }
}

export async function addBackgroundAudioToFinalVideo({ video, silentVideoUrl }) {
  const existingAudio = getAudioMetadata(video);
  const audioTrackId = normalizeAudioTrackId(existingAudio.audio_track_id);

  if (!audioTrackId) {
    return {
      finalVideoUrl: silentVideoUrl,
      overlays: mergeAudioMetadataIntoOverlays(video.overlays, {
        audio_track_id: null,
        audio_status: "none",
        final_video_without_audio_url: silentVideoUrl,
        final_video_with_audio_url: null,
        audio_error_message: null,
      }),
      audioFailed: false,
    };
  }

  const workDir = join(tmpdir(), `propreel-audio-${video.id || Date.now()}`);
  await mkdir(workDir, { recursive: true });

  try {
    const track = await getAudioTrackById(audioTrackId);
    if (!track) throw new Error("Selected audio track is not available.");

    const silentPath = join(workDir, "silent.mp4");
    const audioPath = join(workDir, "music.mp3");
    const outputPath = join(workDir, "with-audio.mp4");

    await downloadFile(silentVideoUrl, silentPath);
    await downloadAudioTrack(track, audioPath);

    const durationSeconds = await getVideoDurationSeconds(silentPath);
    await runAudioMerge({ videoPath: silentPath, audioPath, outputPath, durationSeconds });

    const finalVideoUrl = await uploadVideoToSupabase({
      inputPath: outputPath,
      userId: video.userId,
      videoId: video.id,
    });

    return {
      finalVideoUrl,
      overlays: mergeAudioMetadataIntoOverlays(video.overlays, {
        audio_track_id: audioTrackId,
        audio_status: "completed",
        final_video_without_audio_url: silentVideoUrl,
        final_video_with_audio_url: finalVideoUrl,
        audio_error_message: null,
      }),
      audioFailed: false,
    };
  } catch {
    return {
      finalVideoUrl: silentVideoUrl,
      overlays: mergeAudioMetadataIntoOverlays(video.overlays, {
        audio_track_id: audioTrackId,
        audio_status: "failed",
        final_video_without_audio_url: silentVideoUrl,
        final_video_with_audio_url: null,
        audio_error_message: "Selected audio track file could not be loaded. Silent video fallback used.",
      }),
      audioFailed: true,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => null);
  }
}
