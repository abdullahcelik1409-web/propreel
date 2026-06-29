create extension if not exists pgcrypto;

create table if not exists public.demo_events (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  event_name text not null,
  demo_id text,
  cta_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  rid text,
  page_path text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists demo_events_created_at_idx on public.demo_events (created_at);
create index if not exists demo_events_event_name_idx on public.demo_events (event_name);
create index if not exists demo_events_utm_campaign_idx on public.demo_events (utm_campaign);
create index if not exists demo_events_demo_id_idx on public.demo_events (demo_id);
create index if not exists demo_events_rid_idx on public.demo_events (rid);

alter table public.demo_events enable row level security;
revoke all on public.demo_events from anon, authenticated;
