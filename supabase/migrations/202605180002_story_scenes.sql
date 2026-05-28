create table public.story_scenes (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  scene_no integer not null check (scene_no between 1 and 10),
  title text not null,
  setting text not null,
  body text not null,
  dialogue text not null,
  visual_prompt text not null,
  emotion text not null,
  created_at timestamptz not null default now(),
  unique (story_id, scene_no)
);

create index story_scenes_story_id_scene_no_idx
  on public.story_scenes (story_id, scene_no);

alter table public.story_scenes enable row level security;

alter table public.story_choices
  add column chapter_no integer not null default 1 check (chapter_no between 1 and 10);

alter table public.story_choices
  drop constraint story_choices_story_id_choice_id_key;

alter table public.story_choices
  add constraint story_choices_story_id_chapter_no_choice_id_key
  unique (story_id, chapter_no, choice_id);

create index story_choices_story_id_chapter_no_idx
  on public.story_choices (story_id, chapter_no);
