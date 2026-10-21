create table public.braklabbet_progress (
  user_id uuid not null,
  mission_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);

grant select, insert on public.braklabbet_progress to authenticated;
grant all on public.braklabbet_progress to service_role;

alter table public.braklabbet_progress enable row level security;

create policy "Users read own mission progress"
on public.braklabbet_progress
for select to authenticated
using (auth.uid() = user_id);

create policy "Users insert own mission progress"
on public.braklabbet_progress
for insert to authenticated
with check (auth.uid() = user_id);