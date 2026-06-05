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

async function runFfmpeg(args) {
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
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg merge failed with code ${code}: ${stderr.slice(-600)}`));
    });
  });
}

export async function mergeProviderVideoClips(videoUrls, { videoId }) {
  if (!Array.isArray(videoUrls) || videoUrls.length < 2) return videoUrls?.[0] || null;

  const workDir = join(tmpdir(), `propreel-${videoId || Date.now()}-${randomUUID()}`);
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
