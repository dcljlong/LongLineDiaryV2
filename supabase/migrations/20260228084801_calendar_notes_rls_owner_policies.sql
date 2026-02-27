-- Ensure RLS is enabled
alter table public.calendar_notes enable row level security;

-- Function to set owner_id on insert (when missing)
create or replace function public.set_calendar_notes_owner_id()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;
  return new;
end $$;

-- Trigger (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'tr_calendar_notes_set_owner_id'
  ) then
    create trigger tr_calendar_notes_set_owner_id
    before insert on public.calendar_notes
    for each row
    execute function public.set_calendar_notes_owner_id();
  end if;
end $$;

-- Drop old policies if they exist (idempotent)
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_notes' and policyname='calendar_notes_select_own') then
    drop policy calendar_notes_select_own on public.calendar_notes;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_notes' and policyname='calendar_notes_insert_own') then
    drop policy calendar_notes_insert_own on public.calendar_notes;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_notes' and policyname='calendar_notes_update_own') then
    drop policy calendar_notes_update_own on public.calendar_notes;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='calendar_notes' and policyname='calendar_notes_delete_own') then
    drop policy calendar_notes_delete_own on public.calendar_notes;
  end if;
end $$;

-- Policies: only owner can read/write their notes
create policy calendar_notes_select_own
on public.calendar_notes
for select
using (owner_id = auth.uid());

create policy calendar_notes_insert_own
on public.calendar_notes
for insert
with check (owner_id = auth.uid());

create policy calendar_notes_update_own
on public.calendar_notes
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy calendar_notes_delete_own
on public.calendar_notes
for delete
using (owner_id = auth.uid());

-- Refresh PostgREST schema cache
select pg_notify('pgrst', 'reload schema');