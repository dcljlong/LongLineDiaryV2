-- LLD V2 - Feature tables (activities, materials, equipment, crew, visitors, calendar, settings)

-- ===== WORK ACTIVITIES =====
create table if not exists public.work_activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  daily_log_id uuid references public.daily_logs(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table public.work_activities enable row level security;

drop policy if exists "work_activities_select_own" on public.work_activities;
create policy "work_activities_select_own"
on public.work_activities for select
using (auth.uid() = owner_id);

drop policy if exists "work_activities_insert_own" on public.work_activities;
create policy "work_activities_insert_own"
on public.work_activities for insert
with check (auth.uid() = owner_id);

drop policy if exists "work_activities_update_own" on public.work_activities;
create policy "work_activities_update_own"
on public.work_activities for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "work_activities_delete_own" on public.work_activities;
create policy "work_activities_delete_own"
on public.work_activities for delete
using (auth.uid() = owner_id);

-- ===== MATERIALS =====
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  daily_log_id uuid references public.daily_logs(id) on delete cascade,
  item text not null,
  required_date date,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.materials enable row level security;

drop policy if exists "materials_select_own" on public.materials;
create policy "materials_select_own"
on public.materials for select
using (auth.uid() = owner_id);

drop policy if exists "materials_insert_own" on public.materials;
create policy "materials_insert_own"
on public.materials for insert
with check (auth.uid() = owner_id);

drop policy if exists "materials_update_own" on public.materials;
create policy "materials_update_own"
on public.materials for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "materials_delete_own" on public.materials;
create policy "materials_delete_own"
on public.materials for delete
using (auth.uid() = owner_id);

-- ===== EQUIPMENT LOGS =====
create table if not exists public.equipment_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  daily_log_id uuid references public.daily_logs(id) on delete cascade,
  name text not null,
  due_date date,
  status text default 'ok',
  created_at timestamptz default now()
);

alter table public.equipment_logs enable row level security;

drop policy if exists "equipment_logs_select_own" on public.equipment_logs;
create policy "equipment_logs_select_own"
on public.equipment_logs for select
using (auth.uid() = owner_id);

drop policy if exists "equipment_logs_insert_own" on public.equipment_logs;
create policy "equipment_logs_insert_own"
on public.equipment_logs for insert
with check (auth.uid() = owner_id);

drop policy if exists "equipment_logs_update_own" on public.equipment_logs;
create policy "equipment_logs_update_own"
on public.equipment_logs for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "equipment_logs_delete_own" on public.equipment_logs;
create policy "equipment_logs_delete_own"
on public.equipment_logs for delete
using (auth.uid() = owner_id);

-- ===== CREW ATTENDANCE =====
create table if not exists public.crew_attendance (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  daily_log_id uuid references public.daily_logs(id) on delete cascade,
  name text not null,
  role text,
  present boolean default true,
  due_date date,
  created_at timestamptz default now()
);

alter table public.crew_attendance enable row level security;

drop policy if exists "crew_attendance_select_own" on public.crew_attendance;
create policy "crew_attendance_select_own"
on public.crew_attendance for select
using (auth.uid() = owner_id);

drop policy if exists "crew_attendance_insert_own" on public.crew_attendance;
create policy "crew_attendance_insert_own"
on public.crew_attendance for insert
with check (auth.uid() = owner_id);

drop policy if exists "crew_attendance_update_own" on public.crew_attendance;
create policy "crew_attendance_update_own"
on public.crew_attendance for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "crew_attendance_delete_own" on public.crew_attendance;
create policy "crew_attendance_delete_own"
on public.crew_attendance for delete
using (auth.uid() = owner_id);

-- ===== VISITORS =====
create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  daily_log_id uuid references public.daily_logs(id) on delete cascade,
  name text not null,
  company text,
  created_at timestamptz default now()
);

alter table public.visitors enable row level security;

drop policy if exists "visitors_select_own" on public.visitors;
create policy "visitors_select_own"
on public.visitors for select
using (auth.uid() = owner_id);

drop policy if exists "visitors_insert_own" on public.visitors;
create policy "visitors_insert_own"
on public.visitors for insert
with check (auth.uid() = owner_id);

drop policy if exists "visitors_update_own" on public.visitors;
create policy "visitors_update_own"
on public.visitors for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "visitors_delete_own" on public.visitors;
create policy "visitors_delete_own"
on public.visitors for delete
using (auth.uid() = owner_id);

-- ===== CALENDAR NOTES =====
create table if not exists public.calendar_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null,
  note text not null,
  created_at timestamptz default now()
);

alter table public.calendar_notes enable row level security;

drop policy if exists "calendar_notes_select_own" on public.calendar_notes;
create policy "calendar_notes_select_own"
on public.calendar_notes for select
using (auth.uid() = owner_id);

drop policy if exists "calendar_notes_insert_own" on public.calendar_notes;
create policy "calendar_notes_insert_own"
on public.calendar_notes for insert
with check (auth.uid() = owner_id);

drop policy if exists "calendar_notes_update_own" on public.calendar_notes;
create policy "calendar_notes_update_own"
on public.calendar_notes for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "calendar_notes_delete_own" on public.calendar_notes;
create policy "calendar_notes_delete_own"
on public.calendar_notes for delete
using (auth.uid() = owner_id);

-- ===== APP SETTINGS =====
create table if not exists public.app_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_own" on public.app_settings;
create policy "app_settings_select_own"
on public.app_settings for select
using (auth.uid() = owner_id);

drop policy if exists "app_settings_insert_own" on public.app_settings;
create policy "app_settings_insert_own"
on public.app_settings for insert
with check (auth.uid() = owner_id);

drop policy if exists "app_settings_update_own" on public.app_settings;
create policy "app_settings_update_own"
on public.app_settings for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

