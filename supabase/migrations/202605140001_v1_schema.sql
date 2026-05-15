create extension if not exists pgcrypto;

create type story_status as enum (
  'draft',
  'preview_ready',
  'choice_selected',
  'payment_pending',
  'paid',
  'completed',
  'blocked',
  'generation_failed'
);

create type payment_status as enum (
  'pending',
  'paid',
  'failed',
  'canceled',
  'refunded'
);

create type deletion_request_status as enum (
  'requested',
  'processing',
  'completed',
  'rejected'
);

create table public.story_inputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  breakup_moment text not null check (char_length(breakup_moment) between 2 and 80),
  breakup_reason text not null check (char_length(breakup_reason) between 2 and 80),
  alternative_choice text not null check (char_length(alternative_choice) between 5 and 600),
  emotion text not null check (emotion in ('regret', 'longing', 'anger', 'calm', 'gratitude')),
  desired_ending text not null check (desired_ending in ('reunion', 'growth', 'farewell', 'parallel_world')),
  protagonist_alias text not null check (char_length(protagonist_alias) between 1 and 24),
  partner_alias text not null check (char_length(partner_alias) between 1 and 24),
  raw_input jsonb not null default '{}'::jsonb,
  sanitized_input jsonb not null default '{}'::jsonb,
  status story_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  input_id uuid not null references public.story_inputs(id) on delete cascade,
  title text not null,
  genre text not null,
  summary text not null,
  tone text not null,
  status story_status not null default 'preview_ready',
  is_paid boolean not null default false,
  selected_choice_id text check (selected_choice_id in ('A', 'B', 'C')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_chapters (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  chapter_no integer not null check (chapter_no between 1 and 10),
  title text not null,
  body text not null,
  ending_hook text not null,
  is_free boolean not null default false,
  created_at timestamptz not null default now(),
  unique (story_id, chapter_no)
);

create table public.story_choices (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  choice_id text not null check (choice_id in ('A', 'B', 'C')),
  label text not null check (char_length(label) between 4 and 80),
  is_selected boolean not null default false,
  created_at timestamptz not null default now(),
  unique (story_id, choice_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  story_id uuid not null references public.stories(id) on delete cascade,
  product_type text not null check (product_type in ('five_episode_complete')),
  amount integer not null check (amount > 0),
  payment_key text unique,
  order_id text not null unique,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  story_id uuid references public.stories(id) on delete cascade,
  input_text text not null,
  result text not null check (result in ('allowed', 'blocked', 'manual_review')),
  categories text[] not null default '{}',
  message text not null default '',
  created_at timestamptz not null default now()
);

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_name text not null,
  version text not null,
  body text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (prompt_name, version)
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'operator', 'viewer')),
  created_at timestamptz not null default now()
);

create table public.data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  story_id uuid references public.stories(id) on delete set null,
  requester_email text,
  reason text not null default '',
  status deletion_request_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index story_inputs_user_id_created_at_idx on public.story_inputs (user_id, created_at desc);
create index stories_user_id_created_at_idx on public.stories (user_id, created_at desc);
create index stories_status_created_at_idx on public.stories (status, created_at desc);
create index story_chapters_story_id_chapter_no_idx on public.story_chapters (story_id, chapter_no);
create index story_choices_story_id_idx on public.story_choices (story_id);
create index payments_story_id_status_idx on public.payments (story_id, status);
create index moderation_logs_story_id_created_at_idx on public.moderation_logs (story_id, created_at desc);
create index data_deletion_requests_status_created_at_idx on public.data_deletion_requests (status, created_at desc);

alter table public.story_inputs enable row level security;
alter table public.stories enable row level security;
alter table public.story_chapters enable row level security;
alter table public.story_choices enable row level security;
alter table public.payments enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.admin_users enable row level security;
alter table public.data_deletion_requests enable row level security;
