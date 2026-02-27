-- Fix Feature RLS Policies (work_activities/materials/equipment_logs/crew_attendance/visitors)
-- These tables are linked to daily_logs via daily_log_id.
-- Enforce ownership by checking daily_logs.owner_id = auth.uid().

-- WORK ACTIVITIES
alter table public.work_activities enable row level security;

drop policy if exists "work_activities_select_own" on public.work_activities;
drop policy if exists "work_activities_insert_own" on public.work_activities;
drop policy if exists "work_activities_update_own" on public.work_activities;
drop policy if exists "work_activities_delete_own" on public.work_activities;

create policy "work_activities_select_own"
on public.work_activities for select
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = work_activities.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "work_activities_insert_own"
on public.work_activities for insert
with check (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = work_activities.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "work_activities_update_own"
on public.work_activities for update
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = work_activities.daily_log_id
      and dl.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = work_activities.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "work_activities_delete_own"
on public.work_activities for delete
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = work_activities.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

-- MATERIALS
alter table public.materials enable row level security;

drop policy if exists "materials_select_own" on public.materials;
drop policy if exists "materials_insert_own" on public.materials;
drop policy if exists "materials_update_own" on public.materials;
drop policy if exists "materials_delete_own" on public.materials;

create policy "materials_select_own"
on public.materials for select
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = materials.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "materials_insert_own"
on public.materials for insert
with check (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = materials.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "materials_update_own"
on public.materials for update
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = materials.daily_log_id
      and dl.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = materials.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "materials_delete_own"
on public.materials for delete
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = materials.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

-- EQUIPMENT LOGS
alter table public.equipment_logs enable row level security;

drop policy if exists "equipment_logs_select_own" on public.equipment_logs;
drop policy if exists "equipment_logs_insert_own" on public.equipment_logs;
drop policy if exists "equipment_logs_update_own" on public.equipment_logs;
drop policy if exists "equipment_logs_delete_own" on public.equipment_logs;

create policy "equipment_logs_select_own"
on public.equipment_logs for select
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = equipment_logs.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "equipment_logs_insert_own"
on public.equipment_logs for insert
with check (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = equipment_logs.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "equipment_logs_update_own"
on public.equipment_logs for update
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = equipment_logs.daily_log_id
      and dl.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = equipment_logs.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "equipment_logs_delete_own"
on public.equipment_logs for delete
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = equipment_logs.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

-- CREW ATTENDANCE
alter table public.crew_attendance enable row level security;

drop policy if exists "crew_attendance_select_own" on public.crew_attendance;
drop policy if exists "crew_attendance_insert_own" on public.crew_attendance;
drop policy if exists "crew_attendance_update_own" on public.crew_attendance;
drop policy if exists "crew_attendance_delete_own" on public.crew_attendance;

create policy "crew_attendance_select_own"
on public.crew_attendance for select
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = crew_attendance.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "crew_attendance_insert_own"
on public.crew_attendance for insert
with check (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = crew_attendance.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "crew_attendance_update_own"
on public.crew_attendance for update
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = crew_attendance.daily_log_id
      and dl.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = crew_attendance.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "crew_attendance_delete_own"
on public.crew_attendance for delete
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = crew_attendance.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

-- VISITORS
alter table public.visitors enable row level security;

drop policy if exists "visitors_select_own" on public.visitors;
drop policy if exists "visitors_insert_own" on public.visitors;
drop policy if exists "visitors_update_own" on public.visitors;
drop policy if exists "visitors_delete_own" on public.visitors;

create policy "visitors_select_own"
on public.visitors for select
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = visitors.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "visitors_insert_own"
on public.visitors for insert
with check (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = visitors.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "visitors_update_own"
on public.visitors for update
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = visitors.daily_log_id
      and dl.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = visitors.daily_log_id
      and dl.owner_id = auth.uid()
  )
);

create policy "visitors_delete_own"
on public.visitors for delete
using (
  exists (
    select 1
    from public.daily_logs dl
    where dl.id = visitors.daily_log_id
      and dl.owner_id = auth.uid()
  )
);
