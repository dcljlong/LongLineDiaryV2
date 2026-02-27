-- Add owner_id to calendar_notes to match app expectations
alter table public.calendar_notes
  add column if not exists owner_id uuid null;

-- Optional but recommended: FK + index
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'calendar_notes_owner_id_fkey'
  ) then
    alter table public.calendar_notes
      add constraint calendar_notes_owner_id_fkey
      foreign key (owner_id) references auth.users(id)
      on delete cascade;
  end if;
end $$;

create index if not exists calendar_notes_owner_id_idx
  on public.calendar_notes(owner_id);

-- Refresh PostgREST schema cache
select pg_notify('pgrst', 'reload schema');