import { supabase } from '@/lib/supabase';
import type { Project, DailyLog, CrewAttendance, WorkActivity, Material, EquipmentLog, Visitor, CalendarNote, AppSettings } from './sitecommand-types';
import { DEFAULT_SETTINGS } from './sitecommand-types';

// Helper to get current user ID for RLS-compatible inserts
async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Attach owner_id for tables that use owner_id
async function withOwnerId<T extends Record<string, any>>(obj: T): Promise<T & { owner_id?: string }> {
  const uid = await getUserId();
  if (uid) return { ...obj, owner_id: uid };
  return obj;
}

// Attach user_id for tables that use user_id
async function withUserId<T extends Record<string, any>>(obj: T): Promise<T & { user_id?: string }> {
  const uid = await getUserId();
  if (uid) return { ...obj, user_id: uid };
  return obj;
}

// Pick only allowed DB columns to avoid "column does not exist" insert/update errors
function pick<T extends Record<string, any>>(obj: T, keys: string[]) {
  const out: any = {};
  for (const k of keys) if (k in obj) out[k] = (obj as any)[k];
  return out;
}

// ─── Projects (public.projects: id, owner_id, name, status, created_at, updated_at) ───
export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Project[];
}

export async function createProject(p: Partial<Project>) {
  const base = pick(p as any, ['name', 'status']);
  const payload = await withOwnerId(base);
  const { data, error } = await supabase.from('projects').insert(payload).select().single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, p: Partial<Project>) {
  const patch = pick(p as any, ['name', 'status']);
  const { data, error } = await supabase.from('projects').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ─── Daily Logs (public.daily_logs: id, owner_id, project_id, log_date, notes, created_at, updated_at) ───
export async function fetchDailyLogs(filters?: { date?: string; project_id?: string }) {
  let q = supabase.from('daily_logs').select('*, projects(*)').order('log_date', { ascending: false });
  if (filters?.date) q = q.eq('log_date', filters.date);
  if (filters?.project_id) q = q.eq('project_id', filters.project_id);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((d: any) => ({ ...d, project: d.projects })) as DailyLog[];
}

// In your current DB there are no child tables (crew_attendance/work_activities/materials/equipment_logs/visitors).
// Provide a compatible shape so UI can render without runtime errors.
export async function fetchDailyLogFull(id: string) {
  const logRes = await supabase.from('daily_logs').select('*, projects(*)').eq('id', id).single();
  if (logRes.error) throw logRes.error;
  const log = logRes.data as any;
  return {
    ...log,
    project: log.projects,
    crew: [],
    activities: [],
    materials: [],
    equipment: [],
    visitors: [],
  } as DailyLog;
}

export async function createDailyLog(log: Partial<DailyLog>) {
  // Only DB columns are allowed; everything else is ignored for now.
  const base = pick(log as any, ['project_id', 'log_date', 'notes']);
  const payload = await withOwnerId(base);
  const { data, error } = await supabase.from('daily_logs').insert(payload).select('*, projects(*)').single();
  if (error) throw error;
  return { ...data, project: (data as any).projects } as DailyLog;
}

export async function updateDailyLog(id: string, log: Partial<DailyLog>) {
  const patch = pick(log as any, ['project_id', 'log_date', 'notes']);
  const { data, error } = await supabase.from('daily_logs').update(patch).eq('id', id).select('*, projects(*)').single();
  if (error) throw error;
  return { ...data, project: (data as any).projects } as DailyLog;
}

export async function deleteDailyLog(id: string) {
  const { error } = await supabase.from('daily_logs').delete().eq('id', id);
  if (error) throw error;
}

// ─── Missing tables in current DB: provide safe stubs to prevent crashes ───
export async function createCrew(_: Partial<CrewAttendance>) { throw new Error("crew_attendance table does not exist in this Supabase project."); }
export async function updateCrew(_: string, __: Partial<CrewAttendance>) { throw new Error("crew_attendance table does not exist in this Supabase project."); }
export async function deleteCrew(_: string) { throw new Error("crew_attendance table does not exist in this Supabase project."); }

export async function createActivity(_: Partial<WorkActivity>) { throw new Error("work_activities table does not exist in this Supabase project."); }
export async function updateActivity(_: string, __: Partial<WorkActivity>) { throw new Error("work_activities table does not exist in this Supabase project."); }
export async function deleteActivity(_: string) { throw new Error("work_activities table does not exist in this Supabase project."); }

export async function createMaterial(_: Partial<Material>) { throw new Error("materials table does not exist in this Supabase project."); }
export async function updateMaterial(_: string, __: Partial<Material>) { throw new Error("materials table does not exist in this Supabase project."); }
export async function deleteMaterial(_: string) { throw new Error("materials table does not exist in this Supabase project."); }

export async function createEquipment(_: Partial<EquipmentLog>) { throw new Error("equipment_logs table does not exist in this Supabase project."); }
export async function updateEquipment(_: string, __: Partial<EquipmentLog>) { throw new Error("equipment_logs table does not exist in this Supabase project."); }
export async function deleteEquipment(_: string) { throw new Error("equipment_logs table does not exist in this Supabase project."); }

export async function createVisitor(_: Partial<Visitor>) { throw new Error("visitors table does not exist in this Supabase project."); }
export async function updateVisitor(_: string, __: Partial<Visitor>) { throw new Error("visitors table does not exist in this Supabase project."); }
export async function deleteVisitor(_: string) { throw new Error("visitors table does not exist in this Supabase project."); }

// ─── Calendar Notes (public.calendar_notes uses user_id for RLS) ───
export async function fetchCalendarNotes(month?: number, year?: number) {
  let q = supabase.from('calendar_notes').select('*').order('note_date');
  if (month !== undefined && year !== undefined) {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endMonth = month === 11 ? 0 : month + 1;
    const endYear = month === 11 ? year + 1 : year;
    const end = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`;
    q = q.gte('note_date', start).lt('note_date', end);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as CalendarNote[];
}

export async function createCalendarNote(n: Partial<CalendarNote>) {
  const base = pick(n as any, ['note_date', 'title', 'description', 'note_type', 'priority', 'project_id', 'is_completed']);
  const payload = await withOwnerId(base);
  const { data, error } = await supabase.from('calendar_notes').insert(payload).select().single();
  if (error) throw error;
  return data as CalendarNote;
}

export async function updateCalendarNote(id: string, n: Partial<CalendarNote>) {
  const patch = pick(n as any, ['note_date', 'title', 'description', 'note_type', 'priority', 'project_id', 'is_completed']);
  const { data, error } = await supabase.from('calendar_notes').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as CalendarNote;
}

export async function deleteCalendarNote(id: string) {
  const { error } = await supabase.from('calendar_notes').delete().eq('id', id);
  if (error) throw error;
}

// ─── Settings (app_settings table does not exist in current DB) ───
export async function fetchSettings(): Promise<AppSettings> {
  return DEFAULT_SETTINGS;
}

export async function saveSettings(_: AppSettings) {
  // no-op until app_settings exists
}

// ─── Aggregation helpers (re-implemented to use existing tables only) ───
export async function fetchAllIncompleteItems() {
  const { data, error } = await supabase
    .rpc('get_command_center_rows');

  if (error) throw error;

  const rows = (data ?? []) as any[];

    const mapRow = (r: any) => {
    const title = (r.title ?? '').toString();
    const details = (r.details ?? '').toString();

    return {
      id: r.id,
      title,
      description: details || title,       // Dashboard expects description
      notes: details || null,              // Dashboard renders notes if present
      equipment_name: title || null,       // legacy fallback paths
      worker_name: title || null,

      priority: r.priority ?? 'medium',
      due_date: r.due_date ?? null,
      status: r.status,
      category: r.category,
      project_id: r.project_id ?? null,
      site_name: r.site_name ?? null,
      bucket: r.bucket,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  };
  const activities: any[] = [];
  const materials: any[] = [];
  const equipment: any[] = [];
  const crew: any[] = [];

  for (const r of rows) {
    const item = mapRow(r);
    const cat = (r.category ?? '').toLowerCase();

    if (cat.includes('material')) materials.push(item);
    else if (cat.includes('equip')) equipment.push(item);
    else if (cat.includes('crew')) crew.push(item);
    else activities.push(item);
  }

  return { activities, materials, equipment, crew };
}

export async function fetchDashboardStats() {
  const today = new Date().toISOString().split('T')[0];

  const [projRes, logsRes, notesRes] = await Promise.all([
    supabase.from('projects').select('id, status').eq('status', 'active'),
    supabase.from('daily_logs').select('id, log_date').eq('log_date', today),
    supabase.from('calendar_notes').select('id, priority, is_completed, note_date'),
  ]);

  if (projRes.error) throw projRes.error;
  if (logsRes.error) throw logsRes.error;
  if (notesRes.error) throw notesRes.error;

  const activeProjects = (projRes.data || []).length;
  const totalLogs = (logsRes.data || []).length;

  const openNotes = (notesRes.data || []).filter((n: any) => n.is_completed === false);
  const highPriorityLogs = openNotes.filter((n: any) => n.priority === 'high').length;

  // Not available in current schema
  const safetyIncidents = 0;
  const overdueActivities = 0;
  const overdueMaterials = 0;
  const pendingMaterials = 0;
  const totalOverdue = 0;

  return {
    activeProjects,
    totalLogs,
    highPriorityLogs,
    safetyIncidents,
    overdueActivities,
    overdueMaterials,
    pendingMaterials,
    totalOverdue,
  };
}





