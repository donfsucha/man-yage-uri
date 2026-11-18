-- Run once in the existing project's SQL editor. No anonymous/public writes.
create table if not exists public.xcan_link_schedules (
 slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{0,47}$'),
 config jsonb not null,
 revision integer not null default 1,
 updated_at timestamptz not null default now()
);
create table if not exists public.xcan_link_schedule_history (
 slug text not null,
 config jsonb not null,
 revision integer not null,
 updated_at timestamptz not null,
 primary key(slug,revision)
);
alter table public.xcan_link_schedules enable row level security;
alter table public.xcan_link_schedule_history enable row level security;
revoke all on public.xcan_link_schedules,public.xcan_link_schedule_history from anon,authenticated;
grant all on public.xcan_link_schedules,public.xcan_link_schedule_history to service_role;
create or replace function public.save_xcan_link_schedule(p_slug text,p_config jsonb,p_revision integer)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare result public.xcan_link_schedules;
begin
 if p_revision=0 then
  insert into public.xcan_link_schedules(slug,config) values(p_slug,p_config)
  on conflict do nothing returning * into result;
 else
  update public.xcan_link_schedules set config=p_config,revision=revision+1,updated_at=now()
  where slug=p_slug and revision=p_revision returning * into result;
 end if;
 if result.slug is null then raise exception 'REVISION_CONFLICT'; end if;
 insert into public.xcan_link_schedule_history(slug,config,revision,updated_at)
 values(result.slug,result.config,result.revision,result.updated_at);
 return to_jsonb(result);
end; $$;
revoke all on function public.save_xcan_link_schedule(text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.save_xcan_link_schedule(text,jsonb,integer) to service_role;
