-- Carry-Forward Engine v1 (enterprise persistent model)
-- RPC: carry_forward_action_items(target_date date)
-- Rules:
-- - Only affects caller-owned action_items (owner_id = auth.uid())
-- - Only items NOT done/cancelled
-- - Only items with defer_until is null OR defer_until <= target_date
-- - Soft deletes respected (deleted_at is null)
-- Behavior:
-- - Sets due_date = target_date for eligible items where due_date < target_date
-- - Does NOT touch completed_at/cancelled_at/deleted_at
-- - Returns count updated

create or replace function public.carry_forward_action_items(target_date date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.action_items
  set due_date = target_date,
      updated_at = now()
  where deleted_at is null
    and owner_id = auth.uid()
    and status not in ('done','cancelled')
    and (defer_until is null or defer_until <= target_date)
    and (due_date is null or due_date < target_date);

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.carry_forward_action_items(date) from public;
grant execute on function public.carry_forward_action_items(date) to authenticated;
