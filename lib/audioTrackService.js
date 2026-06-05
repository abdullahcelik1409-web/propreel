import { FALLBACK_AUDIO_TRACKS, NO_AUDIO_OPTION } from "./audioConfig";
import { prisma } from "./prisma";

function toAudioTrack(row) {
  return {
    audio_id: row.audio_id,
    label: row.label,
    description: row.description,
    storage_bucket: row.storage_bucket,
    storage_path: row.storage_path,
    source_name: row.source_name || null,
    source_url: row.source_url || null,
    license_name: row.license_name || null,
    attribution_required: !!row.attribution_required,
    content_id_registered: !!row.content_id_registered,
    ai_generated: !!row.ai_generated,
    author_name: row.author_name || null,
    duration_seconds: row.duration_seconds || null,
  };
}

export async function getActiveAudioTracks() {
  try {
    const rows = await prisma.$queryRaw`
      select
        audio_id,
        label,
        description,
        storage_bucket,
        storage_path,
        source_name,
        source_url,
        license_name,
        attribution_required,
        content_id_registered,
        ai_generated,
        author_name,
        duration_seconds
      from public.video_audio_tracks
      where is_active = true
      order by
        case audio_id
          when 'soft' then 1
          when 'funk_funky' then 2
          when 'romantic_video' then 3
          when 'epic_background' then 4
          else 50
        end,
        label asc
    `;
    if (Array.isArray(rows) && rows.length) return rows.map(toAudioTrack);
  } catch {
    // Keep the generator usable if the audio metadata table is temporarily unavailable.
  }
  return FALLBACK_AUDIO_TRACKS;
}

export async function getAudioTrackById(audioTrackId) {
  if (!audioTrackId) return null;
  const tracks = await getActiveAudioTracks();
  return tracks.find((track) => track.audio_id === audioTrackId) || null;
}

export async function getAudioTrackOptions() {
  const tracks = await getActiveAudioTracks();
  return [NO_AUDIO_OPTION, ...tracks];
}
