-- Carry-Forward Engine v1 (enterprise persistent model)
-- Adds defer_until (date) + index, preserving soft delete model

alter table public.action_items
add column if not exists defer_until date null;

create index if not exists action_items_defer_until_idx
on public.action_items (defer_until)
where deleted_at is null;
