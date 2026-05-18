create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade,
  event_name text not null check (
    event_name in (
      'landing_view',
      'story_start',
      'preview_generated',
      'checkout_click'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_story_id_created_at_idx
  on public.analytics_events (story_id, created_at desc);

create index analytics_events_event_name_created_at_idx
  on public.analytics_events (event_name, created_at desc);

alter table public.analytics_events enable row level security;
