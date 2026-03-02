-- Fix: get_command_center_rows() return type mismatch (42P13)
-- Strategy:
-- 1) Avoid ai.* (explicit column list, stable order)
-- 2) Cast bucket to text
-- 3) Keep signature RETURNS TABLE(...) exactly as expected by client

create or replace function public.get_command_center_rows()
returns table(
  id uuid,
  company_id uuid,
  owner_id uuid,
  project_id uuid,
  site_name text,
  title text,
  details text,
  category text,
  priority action_priority,
  status action_status,
  due_date date,
  defer_until date,
  pinned boolean,
  source text,
  source_ref jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  deleted_at timestamptz,
  completed_on date,
  bucket text
)
language sql
stable
as $$
  select
    ai.id,
    ai.company_id,
    ai.owner_id,
    ai.project_id,
    ai.site_name,
    ai.title,
    ai.details,
    ai.category,
    ai.priority,
    ai.status,
    ai.due_date,
    ai.defer_until,
    ai.pinned,
    ai.source,
    ai.source_ref,
    ai.created_at,
    ai.updated_at,
    ai.completed_at,
    ai.cancelled_at,
    ai.deleted_at,
    ai.completed_on,
    (
      case
        when ai.due_date is not null and ai.due_date < current_date then 'overdue'
        when ai.due_date = current_date then 'due_today'
        when ai.due_date is null then 'no_due_date'
        else 'upcoming'
      end
    )::text as bucket
  from public.action_items ai
  where ai.deleted_at is null
    and ai.status in ('open','in_progress','blocked')
    and (ai.defer_until is null or ai.defer_until <= current_date);
$$;

-- Verification (run in SQL editor after migration applied):
-- select * from public.get_command_center_rows() limit 5;
