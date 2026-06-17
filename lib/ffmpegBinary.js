import { access } from "node:fs/promises";
import { join } from "node:path";

export async function getFfmpegPath({ purpose = "ffmpeg operation" } = {}) {
  const platform = `${process.platform}-${process.arch}`;
  const binary = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const ffmpegPath = process.env.FFMPEG_PATH || join(process.cwd(), "node_modules", "@ffmpeg-installer", platform, binary);

  try {
    await access(ffmpegPath);
    return ffmpegPath;
  } catch (error) {
    throw new Error(`ffmpeg binary is not available for ${purpose}: ${error?.message || error}`);
  }
}
