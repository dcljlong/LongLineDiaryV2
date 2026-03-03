import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardKpis from './dashboard/DashboardKpis';
import DashboardJobsStrip from './dashboard/DashboardJobsStrip';
import {
  Package,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Briefcase,
  Activity,
  Wrench,
  UserCheck,
  Truck,
  Eye,
  ClipboardList,
} from 'lucide-react';

import type { Project, DailyLog, AppSettings } from '@/lib/sitecommand-types';
import { DEFAULT_SETTINGS } from '@/lib/sitecommand-types';
import { formatDate, todayStr, relativeDayLabel } from '@/lib/sitecommand-utils';
import { supabase } from '@/lib/supabase';
import { fetchProjects, fetchDailyLogs, fetchAllIncompleteItems, fetchSettings } from '@/lib/sitecommand-store';
import PriorityBadge from './PriorityBadge';
import ActionItemDetailModal from './ActionItemDetailModal';

interface DashboardPageProps {
  onNavigate: (page: string, data?: any) => void;
  onQuickAdd: () => void;
}

interface IncompleteItems {
  activities: any[];
  materials: any[];
  equipment: any[];
  crew: any[];
}

type BucketKey = 'overdue' | 'due_today' | 'upcoming' | 'no_due_date';

const BUCKETS: Array<{
  key: BucketKey;
  title: string;
  pillClass: string;
  cardLeftBorderClass: string;
}> = [
  {
    key: 'overdue',
    title: 'Overdue',
    pillClass:
      'text-[hsl(var(--status-danger))] bg-[hsl(var(--status-danger)/0.56)] border border-[hsl(var(--status-danger)/0.98)] font-bold shadow-[0_0_12px_currentColor/0.25]',
    cardLeftBorderClass:
      'border-l-4 border-l-[hsl(var(--status-danger))] shadow-[0_0_0_1px_hsl(var(--status-danger)/0.15)]',
  },
  {
    key: 'due_today',
    title: 'Due Today',
    pillClass:
      'text-[hsl(var(--status-warning))] bg-[hsl(var(--status-warning)/0.56)] border border-[hsl(var(--status-warning)/0.98)] font-bold shadow-[0_0_12px_currentColor/0.25]',
    cardLeftBorderClass:
      'border-l-4 border-l-[hsl(var(--status-warning))] shadow-[0_0_0_1px_hsl(var(--status-warning)/0.15)]',
  },
  {
    key: 'upcoming',
    title: 'Upcoming',
    pillClass:
      'text-[hsl(var(--status-info))] bg-[hsl(var(--status-info)/0.56)] border border-[hsl(var(--status-info)/0.98)] font-bold shadow-[0_0_12px_currentColor/0.25]',
    cardLeftBorderClass:
      'border-l-4 border-l-[hsl(var(--status-info))] shadow-[0_0_0_1px_hsl(var(--status-info)/0.12)]',
  },
  {
    key: 'no_due_date',
    title: 'No Due Date',
    pillClass:
      'text-[hsl(var(--status-neutral))] bg-[hsl(var(--status-neutral)/0.56)] border border-[hsl(var(--status-neutral)/0.98)] font-bold shadow-[0_0_12px_currentColor/0.25]',
    cardLeftBorderClass: 'border-l-4 border-l-[hsl(var(--status-neutral))]',
  },
];

function toDateOnlyStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function computeBucketFallback(dueDate: any): BucketKey {
  if (!dueDate) return 'no_due_date';
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 'no_due_date';
  const today = new Date();
  const todayStrLocal = toDateOnlyStr(today);
  const dueStrLocal = toDateOnlyStr(due);
  if (dueStrLocal < todayStrLocal) return 'overdue';
  if (dueStrLocal === todayStrLocal) return 'due_today';
  return 'upcoming';
}

function priorityRank(p?: string | null): number {
  if (!p) return 3;
  const v = String(p).toLowerCase();
  if (v === 'critical') return 0;
  if (v === 'high') return 1;
  if (v === 'medium') return 2;
  if (v === 'low') return 3;
  return 3;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onQuickAdd }) => {
  function goProject(projectId: string) {
    onNavigate('action-items', { projectId: String(projectId) });
  }

  const [projects, setProjects] = useState<Project[]>([]);
  const [todayLogs, setTodayLogs] = useState<DailyLog[]>([]);
  const [incomplete, setIncomplete] = useState<IncompleteItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [carryBusy, setCarryBusy] = useState(false);
  const [carryNote, setCarryNote] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const openDetail = (item: any) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedItem(null);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, tl, inc, s] = await Promise.all([
        fetchProjects(),
        fetchDailyLogs({ date: todayStr() }),
        fetchAllIncompleteItems(),
        fetchSettings(),
      ]);
      setProjects(p);
      setTodayLogs(tl);
      setIncomplete(inc);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...(s as any),
        features: { ...DEFAULT_SETTINGS.features, ...((s as any)?.features || {}) },
        alerts: { ...(DEFAULT_SETTINGS as any).alerts, ...((s as any)?.alerts || {}) },
      } as any);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const handler = () => {
      void loadData();
    };
    window.addEventListener('lldv2:action-items-changed', handler as EventListener);
    return () => {
      window.removeEventListener('lldv2:action-items-changed', handler as EventListener);
    };
  }, [loadData]);

  const carryForwardToToday = async () => {
    const ok = window.confirm('Carry forward ALL overdue items to today?');
    if (!ok) return;
    setCarryBusy(true);
    setCarryNote(null);
    try {
      const target = todayStr();
      const { data, error } = await supabase.rpc('carry_forward_action_items', { target_date: target });
      if (error) throw error;
      const count = Number(data || 0);
      setCarryNote(`Carry forward complete: ${count} item${count === 1 ? '' : 's'} updated`);
      await loadData();
    } catch (e: any) {
      setCarryNote(e?.message || 'Carry forward failed');
    } finally {
      setCarryBusy(false);
      window.setTimeout(() => setCarryNote(null), 4000);
    }
  };

  const allActionItems = useMemo(() => {
    if (!incomplete) return [];
    const items: any[] = [
      ...incomplete.activities,
      ...incomplete.materials,
      ...incomplete.equipment,
      ...incomplete.crew,
    ];

    return items
      .filter((raw) => !raw.defer_until || raw.defer_until <= new Date().toISOString().slice(0, 10))
      .map((raw) => {
        const due = raw.due_date ?? raw.required_date ?? null;
        const bucket: BucketKey = (raw.bucket as BucketKey) || computeBucketFallback(due);

        const projectName =
          raw.daily_logs?.projects?.name ?? raw.project?.name ?? raw.projects?.name ?? raw._project ?? 'Unknown';

        const jobNumber =
          raw.daily_logs?.projects?.job_number ??
          raw.project?.job_number ??
          raw.projects?.job_number ??
          raw._jobNumber ??
          '';

        const title = raw.title ?? raw.description ?? raw.equipment_name ?? raw.worker_name ?? 'Unnamed';
        const details = raw.details ?? raw.notes ?? raw.note ?? '';
        const priority = raw.priority ?? raw._priority ?? 'medium';

        return {
          ...raw,
          _bucket: bucket,
          _due: due,
          _project: String(projectName),
          _jobNumber: String(jobNumber),
          _title: String(title),
          _details: String(details),
          _priority: String(priority),
        };
      });
  }, [incomplete]);

  const bucketed = useMemo(() => {
    const byBucket: Record<BucketKey, any[]> = { overdue: [], due_today: [], upcoming: [], no_due_date: [] };
    for (const item of allActionItems) byBucket[item._bucket as BucketKey].push(item);

    const sortFn = (a: any, b: any) => {
      const pa = priorityRank(a._priority);
      const pb = priorityRank(b._priority);
      if (pa !== pb) return pa - pb;

      const ad = a._due ? new Date(a._due).getTime() : Number.POSITIVE_INFINITY;
      const bd = b._due ? new Date(b._due).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    };

    (Object.keys(byBucket) as BucketKey[]).forEach((k) => {
      byBucket[k] = byBucket[k].sort(sortFn);
    });

    return byBucket;
  }, [allActionItems]);

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'active'), [projects]);
  const activeProjectsCount = activeProjects.length;

  const mOpen = allActionItems.length;
  const mOverdue = bucketed.overdue.length;
  const mDeferred = 0;
  const mDone7 = 0;

  const criticalCount = useMemo(() => allActionItems.filter(i => String(i._priority || '').toLowerCase() === 'critical').length, [allActionItems]);
  const highCount = useMemo(() => allActionItems.filter(i => String(i._priority || '').toLowerCase() === 'high').length, [allActionItems]);
const statCards = [
    { key: 'projects', label: 'Projects', value: activeProjectsCount, icon: Briefcase },
    { key: 'open', label: 'Open Items', value: mOpen, icon: ClipboardList },
    { key: 'overdue', label: 'Overdue', value: mOverdue, icon: Clock },
    { key: 'deferred', label: 'Deferred', value: mDeferred, icon: Clock },
    { key: 'done7', label: 'Done (7d)', value: mDone7, icon: CheckCircle2 },
  ];

  const quickActions = [
    { label: 'Work Activity', icon: Activity, action: () => onNavigate('daily-logs', { tab: 'activities' }) },
    { label: 'Materials', icon: Package, action: () => onNavigate('daily-logs', { tab: 'materials' }) },
    { label: 'Equipment', icon: Wrench, action: () => onNavigate('daily-logs', { tab: 'equipment' }) },
    { label: 'Crew', icon: UserCheck, action: () => onNavigate('daily-logs', { tab: 'crew' }) },
    { label: 'Visitor', icon: Eye, action: () => onNavigate('daily-logs', { tab: 'visitors' }) },
    { label: 'Delivery', icon: Truck, action: () => onNavigate('calendar', { type: 'delivery' }) },
  ];

  const todayLabel = useMemo(() => {
    const t = todayStr();
    return `${formatDate(t)} (${relativeDayLabel(t)})`;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const renderItem = (it: any) => {
    const dueLabel = it._due ? `${formatDate(it._due)} (${relativeDayLabel(it._due)})` : 'No due date';
    return (
      <button
        key={it.id}
        type="button"
        onClick={() => openDetail(it)}
        className="w-full rounded-md border p-3 text-left hover:bg-[hsl(var(--surface-hover))]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-medium">{it._title}</div>
            {it._details ? <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it._details}</div> : null}
            <div className="mt-2 text-xs text-muted-foreground">
              {it._project}
              {it._jobNumber ? ` • ${it._jobNumber}` : ''}
              {it._due ? ` • Due ${dueLabel}` : ' • No due date'}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <PriorityBadge priority={it._priority} />
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="d-space-y">
      {/* Header */}
      <div className="rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] d-card-pad shadow-[var(--shadow-1)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Command Center</div>
            <div className="text-sm text-muted-foreground">Today: {todayLabel}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Projects: {projects.length} • Today logs: {todayLogs.length} • Items: {allActionItems.length}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onQuickAdd}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-[hsl(var(--surface-hover))]"
            >
              <Plus className="h-4 w-4" />
              Quick Add
            </button>

            <button
              type="button"
              onClick={carryForwardToToday}
              disabled={carryBusy}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-[hsl(var(--surface-hover))] disabled:opacity-50"
              title="Carry forward overdue items to today"
            >
              <ArrowRight className="h-4 w-4" />
              Carry Forward
            </button>
          </div>
        </div>

        {carryNote ? <div className="mt-3 text-sm text-muted-foreground">{carryNote}</div> : null}

                {/* Priority */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onNavigate('action-items', { priority: 'critical' })}
            className={`flex items-center justify-between rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] px-4 py-3 shadow-[var(--shadow-1)] text-[hsl(var(--status-danger))] ${
              ((settings as any)?.alerts?.pulseCritical && criticalCount > 0) ? 'lld-pulse' : ''
            }`}
            title="Critical — Do immediately"
          >
            <div>
              <div className="text-xs font-semibold tracking-wide">CRITICAL</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Do immediately</div>
            </div>
            <div className="text-2xl font-extrabold">{criticalCount}</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('action-items', { priority: 'high' })}
            className={`flex items-center justify-between rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] px-4 py-3 shadow-[var(--shadow-1)] text-[hsl(var(--status-warning))] ${
              ((settings as any)?.alerts?.pulseHigh && highCount > 0) ? 'lld-pulse' : ''
            }`}
            title="High — Do today or tomorrow"
          >
            <div>
              <div className="text-xs font-semibold tracking-wide">HIGH</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Do today or tomorrow</div>
            </div>
            <div className="text-2xl font-extrabold">{highCount}</div>
          </button>
        </div>
        {/* Stats */}
        <DashboardKpis statCards={statCards} onNavigate={onNavigate} />

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
          {quickActions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.action}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-[hsl(var(--surface-hover))]"
            >
              <a.icon className="h-4 w-4" />
              <span className="truncate">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <DashboardJobsStrip
        activeProjectsCount={activeProjectsCount}
        activeProjects={activeProjects}
        onNavigate={onNavigate}
        onProjectClick={goProject}
      />

      {/* Buckets */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {BUCKETS.map((b) => {
          const items = bucketed[b.key] || [];
          return (
            <div
              key={b.key}
              className={`rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] d-card-pad shadow-[var(--shadow-1)] ${b.cardLeftBorderClass}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{b.title}</div>
                <div className={`text-xs px-2 py-1 rounded-full ${b.pillClass}`}>{items.length}</div>
              </div>

              {items.length === 0 ? (
                <div className="mt-3 text-sm text-muted-foreground">No items.</div>
              ) : (
                <div className="mt-3 space-y-2">{items.slice(0, 10).map(renderItem)}</div>
              )}
            </div>
          );
        })}
      </div>

      <ActionItemDetailModal
        open={detailOpen}
        item={selectedItem}
        onClose={closeDetail}
        onChanged={async () => {
          await loadData();
        }}
      />
    </div>
  );
};

export default DashboardPage;



