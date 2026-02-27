-- Backfill owner_id for existing calendar_notes (required for RLS update policy)
update public.calendar_notes
set owner_id = auth.uid()
where owner_id is null;

select pg_notify('pgrst', 'reload schema');