export const NO_AUDIO_TRACK_ID = "none";

export const DEFAULT_AUDIO_BY_VIDEO_STYLE = {
  cinematic_luxury: "epic_background",
  social_reel: "funk_funky",
  architectural_walkthrough: "soft",
  warm_lifestyle: "romantic_video",
};

export const FALLBACK_AUDIO_TRACKS = [
  {
    audio_id: "soft",
    label: "Soft",
    description: "Sakin, temiz ve mimari walkthrough tarzi emlak tanitimlari icin.",
    storage_bucket: "media",
    storage_path: "audio/real-estate/soft.mp3",
    content_id_registered: false,
    duration_seconds: 37,
  },
  {
    audio_id: "funk_funky",
    label: "Funk Funky",
    description: "Enerjik, dikkat cekici ve sosyal medya odakli emlak videolari icin.",
    storage_bucket: "media",
    storage_path: "audio/real-estate/funk-funky.mp3",
    content_id_registered: false,
    duration_seconds: 32,
  },
  {
    audio_id: "romantic_video",
    label: "Romantic Video",
    description: "Sicak, huzurlu ve davetkar ev atmosferi veren emlak videolari icin.",
    storage_bucket: "media",
    storage_path: "audio/real-estate/romantic-video.mp3",
    content_id_registered: false,
    duration_seconds: 42,
  },
  {
    audio_id: "epic_background",
    label: "Epic Background",
    description: "Luks ve sinematik emlak tanitimlari icin guclu arka plan muzigi.",
    storage_bucket: "media",
    storage_path: "audio/real-estate/epic-background.mp3",
    content_id_registered: true,
    duration_seconds: 42,
  },
];

export const NO_AUDIO_OPTION = {
  audio_id: NO_AUDIO_TRACK_ID,
  label: "No Music",
  description: "Videoyu muziksiz olusturur. Sonradan kendiniz muzik eklemek isterseniz uygundur.",
  storage_bucket: null,
  storage_path: null,
  content_id_registered: false,
};

export function normalizeAudioTrackId(value) {
  if (value === null || value === undefined || value === "" || value === NO_AUDIO_TRACK_ID) return null;
  const normalized = String(value).trim();
  return FALLBACK_AUDIO_TRACKS.some((track) => track.audio_id === normalized) ? normalized : null;
}

export function createInitialAudioMetadata(audioTrackId) {
  const normalized = normalizeAudioTrackId(audioTrackId);
  return {
    audio_track_id: normalized,
    audio_status: normalized ? "pending" : "none",
    final_video_without_audio_url: null,
    final_video_with_audio_url: null,
    audio_error_message: null,
  };
}

export function getAudioMetadata(videoOrOverlays) {
  const overlays = videoOrOverlays?.overlays || videoOrOverlays || {};
  const audio = overlays?.audio || {};
  return {
    audio_track_id: normalizeAudioTrackId(audio.audio_track_id),
    audio_status: audio.audio_status || (audio.audio_track_id ? "pending" : "none"),
    final_video_without_audio_url: audio.final_video_without_audio_url || null,
    final_video_with_audio_url: audio.final_video_with_audio_url || null,
    audio_error_message: audio.audio_error_message || null,
  };
}

export function mergeAudioMetadataIntoOverlays(overlays, audioMetadata) {
  return {
    ...(overlays || {}),
    audio: {
      ...getAudioMetadata(overlays || {}),
      ...audioMetadata,
    },
  };
}

export function getPlayableVideoUrl(video) {
  const audio = getAudioMetadata(video);
  if (audio.audio_status === "completed" && audio.final_video_with_audio_url) {
    return audio.final_video_with_audio_url;
  }
  return video?.videoUrl || audio.final_video_without_audio_url || null;
}
