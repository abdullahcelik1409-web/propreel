import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getFfmpegPath } from "./ffmpegBinary.js";
import { premiumVideoConfig, buildMockBridgeFrameRef } from "./premiumVideoCore.mjs";

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

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download provider clip for bridge frame: ${response.status}`);
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function runFfmpeg(args) {
  const ffmpegPath = await getFfmpegPath({ purpose: "bridge frame extraction" });
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
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg bridge frame extraction failed with code ${code}: ${stderr.slice(-600)}`));
    });
  });
}

function getStorageObjectUrl(bucket, path, { publicUrl = false } = {}) {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) throw new Error("SUPABASE_URL is missing.");
  const safePath = String(path || "").split("/").map(encodeURIComponent).join("/");
  const base = publicUrl ? "object/public" : "object";
  return `${supabaseUrl}/storage/v1/${base}/${encodeURIComponent(bucket)}/${safePath}`;
}

async function uploadFrameToSupabase({ inputPath, storagePath }) {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");

  const bucket = "media";
  const uploadUrl = getStorageObjectUrl(bucket, storagePath);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "image/jpeg",
      "x-upsert": "true",
    },
    body: await readFile(inputPath),
  });

  if (!response.ok) throw new Error(`Supabase bridge frame upload failed with status ${response.status}`);
  return getStorageObjectUrl(bucket, storagePath, { publicUrl: true });
}

export class PremiumBridgeFrameService {
  constructor({ mode = "mock" } = {}) {
    this.mode = mode;
  }

  async extractLastFrame(clipRef, { jobId, sceneIndex, fallbackUrl } = {}) {
    if (this.mode !== "real") {
      return buildMockBridgeFrameRef({ jobId, sceneIndex, sourceUrl: fallbackUrl || clipRef?.videoUrl });
    }

    if (!clipRef?.videoUrl) {
      throw new Error("Completed clip videoUrl is required for bridge frame extraction.");
    }

    const workDir = join(tmpdir(), `viseo-bridge-${jobId || Date.now()}-${sceneIndex}-${randomUUID()}`);
    await mkdir(workDir, { recursive: true });

    try {
      const clipPath = join(workDir, "clip.mp4");
      const framePath = join(workDir, "last-frame.jpg");
      const storagePath = `premium/${jobId}/frames/scene-${sceneIndex}-last-frame.jpg`;

      await downloadFile(clipRef.videoUrl, clipPath);
      await runFfmpeg(["-y", "-sseof", "-0.1", "-i", clipPath, "-frames:v", "1", "-q:v", "2", framePath]);
      const frameUrl = await uploadFrameToSupabase({ inputPath: framePath, storagePath });

      return {
        provider: premiumVideoConfig.provider,
        frameUrl,
        storagePath,
        metadata: {
          extractedFromClipUrl: clipRef.videoUrl,
          extractionMethod: "ffmpeg_sseof_last_frame",
          fallbackUsed: false,
        },
      };
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => null);
    }
  }

  async createBridgeFrame(previousClipRef, sceneIndex, context = {}) {
    return this.extractLastFrame(previousClipRef, {
      ...context,
      sceneIndex,
      fallbackUrl: context.fallbackUrl || previousClipRef?.videoUrl,
    });
  }

  getStartFrameForScene(sceneIndex, selectedPhoto, previousBridgeFrame) {
    if (sceneIndex > 0 && previousBridgeFrame?.frameUrl) {
      return {
        type: "bridge_frame",
        url: previousBridgeFrame.frameUrl,
        ref: previousBridgeFrame,
      };
    }

    return {
      type: "selected_photo",
      url: selectedPhoto,
      ref: { photoUrl: selectedPhoto },
    };
  }

  async persistBridgeFrameRef(jobId, sceneIndex, frameRef) {
    return {
      ...frameRef,
      jobId,
      sceneIndex,
      storagePath: frameRef?.storagePath || `premium/${jobId}/frames/scene-${sceneIndex}-last-frame.jpg`,
    };
  }
}

export function createPremiumBridgeFrameService(options = {}) {
  return new PremiumBridgeFrameService(options);
}
