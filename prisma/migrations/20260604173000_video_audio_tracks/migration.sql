create extension if not exists pgcrypto;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'media',
  'media',
  true,
  104857600,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'video/mp4']
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.video_audio_tracks (
  id uuid primary key default gen_random_uuid(),
  audio_id text not null unique,
  label text not null,
  description text not null,
  storage_bucket text not null default 'media',
  storage_path text not null,
  source_name text not null,
  source_url text not null,
  license_name text not null,
  attribution_required boolean not null default false,
  content_id_registered boolean not null default false,
  ai_generated boolean not null default false,
  author_name text,
  duration_seconds integer,
  default_for_styles jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_video_audio_tracks_updated_at on public.video_audio_tracks;
create trigger set_video_audio_tracks_updated_at
before update on public.video_audio_tracks
for each row
execute function public.set_updated_at();

alter table public.video_audio_tracks enable row level security;

grant select on public.video_audio_tracks to anon, authenticated;

drop policy if exists "Active audio tracks are readable" on public.video_audio_tracks;
create policy "Active audio tracks are readable"
on public.video_audio_tracks
for select
to anon, authenticated
using (is_active = true);

insert into public.video_audio_tracks (
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
  duration_seconds,
  default_for_styles,
  is_active
)
values
(
  'soft',
  'Soft',
  'Sakin, temiz ve mimari walkthrough tarzı emlak tanıtımları için.',
  'media',
  'audio/real-estate/soft.mp3',
  'Pixabay',
  'https://pixabay.com/sound-effects/musical-soft-499242/',
  'Pixabay Content License',
  false,
  false,
  false,
  'prettyjohn1',
  37,
  '["architectural_walkthrough"]'::jsonb,
  true
),
(
  'funk_funky',
  'Funk Funky',
  'Enerjik, dikkat çekici ve sosyal medya odaklı emlak videoları için.',
  'media',
  'audio/real-estate/funk-funky.mp3',
  'Pixabay',
  'https://pixabay.com/sound-effects/musical-funk-funky-music-32sec-483398/',
  'Pixabay Content License',
  false,
  false,
  false,
  'prettyjohn1',
  32,
  '["social_reel"]'::jsonb,
  true
),
(
  'romantic_video',
  'Romantic Video',
  'Sıcak, huzurlu ve davetkar ev atmosferi veren emlak videoları için.',
  'media',
  'audio/real-estate/romantic-video.mp3',
  'Pixabay',
  'https://pixabay.com/sound-effects/musical-romantic-video-483626/',
  'Pixabay Content License',
  false,
  false,
  true,
  'OceanFrameMusic',
  42,
  '["warm_lifestyle"]'::jsonb,
  true
),
(
  'epic_background',
  'Epic Background',
  'Lüks ve sinematik emlak tanıtımları için güçlü arka plan müziği. Content ID Registered olduğu için sosyal platformlarda otomatik claim uyarısı çıkabilir.',
  'media',
  'audio/real-estate/epic-background.mp3',
  'Pixabay',
  'https://pixabay.com/sound-effects/musical-epic-background-music-484342/',
  'Pixabay Content License',
  false,
  true,
  false,
  'BackgroundMusicForVideos',
  42,
  '["cinematic_luxury"]'::jsonb,
  true
)
on conflict (audio_id) do update set
  label = excluded.label,
  description = excluded.description,
  storage_bucket = excluded.storage_bucket,
  storage_path = excluded.storage_path,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  license_name = excluded.license_name,
  attribution_required = excluded.attribution_required,
  content_id_registered = excluded.content_id_registered,
  ai_generated = excluded.ai_generated,
  author_name = excluded.author_name,
  duration_seconds = excluded.duration_seconds,
  default_for_styles = excluded.default_for_styles,
  is_active = excluded.is_active,
  updated_at = now();
