import { ok } from "@/lib/api";
import { getAudioTrackOptions } from "@/lib/audioTrackService";
import { requireUser } from "@/lib/session";

export async function GET() {
  await requireUser();
  const tracks = await getAudioTrackOptions();
  return ok({ success: true, tracks });
}
