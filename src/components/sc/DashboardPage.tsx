import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

import type { Project, DailyLog } from '@/lib/sitecommand-types';
import { formatDate, todayStr, relativeDayLabel } from '@/lib/sitecommand-utils';
import { supabase } from '@/lib/supabase';
import { fetchProjects, fetchDailyLogs, fetchAllIncompleteItems } from '@/lib/sitecommand-store';
import PriorityBadge from './PriorityBadge';
import ActionItemDetailModal from './ActionItemDetailModal';

interface DashboardPageProps {
  onNavigate: (page: string, data?: any) => void;
  onQuickAdd: () => void;
}

interface DashboardMetrics {
  open_total: number;
  overdue_total: number;
  pinned_total: number;
  deferred_total: number;
  completed_last_7_days: number;
  avg_days_delta: number | null;
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
    pillClass: 'bg-danger/15 text-danger border border-danger/30',
    cardLeftBorderClass: 'border-l-4 border-l-danger/70',
  },
  {
    key: 'due_today',
    title: 'Due Today',
    pillClass: 'bg-primary/15 text-primary border border-primary/30',
    cardLeftBorderClass: 'border-l-4 border-l-primary/70',
  },
  {
    key: 'upcoming',
    title: 'Upcoming',
    pillClass: 'bg-muted text-foreground border border-primary/40',
    cardLeftBorderClass: 'border-l-4 border-l-border',
  },
  {
    key: 'no_due_date',
    title: 'No Due Date',
    pillClass: 'bg-muted/60 text-muted-foreground border border-primary/40',
    cardLeftBorderClass: 'border-l-4 border-l-muted',
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [todayLogs, setTodayLogs] = useState<DailyLog[]>([]);
  const [incomplete, setIncomplete] = useState<IncompleteItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [carryBusy, setCarryBusy] = useState(false);
  const [carryNote, setCarryNote] = useState<string | null>(null);

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
      const [p, tl, inc] = await Promise.all([
        fetchProjects(),
        fetchDailyLogs({ date: todayStr() }),
        fetchAllIncompleteItems(),
      ]);
      setProjects(p);
      setTodayLogs(tl);
      setIncomplete(inc);

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

  const carryForwardProject = async (projectId: string) => {
    if (carryBusy) return;
    const target = todayStr();
    const ok = window.confirm('Carry forward overdue items for this project to today?');
    if (!ok) return;
    setCarryBusy(true);
    setCarryNote(null);
    try {
      const { data, error } = await supabase.rpc('carry_forward_action_items_by_project', {
        target_date: target,
        project_uuid: projectId,
      });
      if (error) throw error;
      const count = Number(data || 0);
      setCarryNote(`Project carry forward complete: ${count} item${count === 1 ? '' : 's'} updated`);
      await loadData();
    } catch (e: any) {
      setCarryNote(e?.message || 'Project carry forward failed');
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
          raw.daily_logs?.projects?.name ??
          raw.project?.name ??
          raw.projects?.name ??
          raw._project ??
          'Unknown';

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

  const statCards = [
    { label: 'Active Projects', value: activeProjectsCount, icon: Briefcase },
    { label: 'Open Items', value: mOpen, icon: ClipboardList },
    { label: 'Overdue', value: mOverdue, icon: Clock },
    { label: 'Deferred', value: mDeferred, icon: Clock },
    { label: 'Done (7d)', value: mDone7, icon: CheckCircle2 },
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
        className="w-full rounded-md border p-3 text-left hover:bg-muted/50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-medium">{it._title}</div>
            {it._details ? (
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it._details}</div>
            ) : null}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border bg-card p-4">
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
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
              Quick Add
            </button>

            <button
              type="button"
              onClick={carryForwardToToday}
              disabled={carryBusy}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
              title="Carry forward overdue items to today"
            >
              <ArrowRight className="h-4 w-4" />
              Carry Forward
            </button>
          </div>
        </div>

        {carryNote ? <div className="mt-3 text-sm text-muted-foreground">{carryNote}</div> : null}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-md border p-3">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
              <div className="mt-2 text-2xl font-semibold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
          {quickActions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.action}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <a.icon className="h-4 w-4" />
              <span className="truncate">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Projects */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Active Projects</div>
          <div className="text-xs text-muted-foreground">{activeProjectsCount} active</div>
        </div>

        {activeProjectsCount === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">
            No active projects found (projects table currently empty for this user).
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {activeProjects.slice(0, 8).map((p: any) => (
              <div key={p.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.name || 'Unnamed Project'}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.job_number ? `Job ${p.job_number}` : ''} {p.site_name ? `• ${p.site_name}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => carryForwardProject(String(p.id))}
                    disabled={carryBusy}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs hover:bg-muted disabled:opacity-50"
                    title="Carry forward overdue items for this project"
                  >
                    <ArrowRight className="h-3 w-3" />
                    Carry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buckets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {BUCKETS.map((b) => {
          const items = bucketed[b.key] || [];
          return (
            <div key={b.key} className={`rounded-lg border bg-card p-4 ${b.cardLeftBorderClass}`}>
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


