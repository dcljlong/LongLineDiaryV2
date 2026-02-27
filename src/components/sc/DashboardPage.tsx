import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HardHat,
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
  // higher priority sorts first
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
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
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

      const { data: m, error: mErr } = await supabase
        .from('dashboard_metrics_v')
        .select('*')
        .single();

      if (!mErr && m) setMetrics(m as any);
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
      const { data, error } = await supabase.rpc(
        'carry_forward_action_items_by_project',
        { target_date: target, project_uuid: projectId }
      );
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
      .filter((raw) => {
        if (!raw.defer_until) return true;
        const today = new Date().toISOString().slice(0, 10);
        return raw.defer_until <= today;
      })
      .map((raw) => {
        const due = raw.due_date ?? raw.required_date ?? null;

        const bucket: BucketKey =
          (raw.bucket as BucketKey) ||
          computeBucketFallback(due);

        const projectName =
          raw.daily_logs?.projects?.name ||
          raw.project?.name ||
          raw.projects?.name ||
          raw._project ||
          'Unknown';

        const jobNumber =
          raw.daily_logs?.projects?.job_number ||
          raw.project?.job_number ||
          raw.projects?.job_number ||
          raw._jobNumber ||
          '';

        const title =
          raw.title ||
          raw.description ||
          raw.equipment_name ||
          raw.worker_name ||
          'Unnamed';

        const details =
          raw.details ||
          raw.notes ||
          raw.note ||
          '';

        const priority = (raw.priority || raw._priority || 'medium');

        return {
          ...raw,
          _bucket: bucket,
          _due: due,
          _project: projectName,
          _jobNumber: jobNumber,
          _title: title,
          _details: details,
          _priority: priority,
        };
      });
  }, [incomplete]);

  const bucketed = useMemo(() => {
    const byBucket: Record<BucketKey, any[]> = {
      overdue: [],
      due_today: [],
      upcoming: [],
      no_due_date: [],
    };

    for (const item of allActionItems) {
      byBucket[item._bucket as BucketKey].push(item);
    }

    const sortFn = (a: any, b: any) => {
      // 1) priority
      const pa = priorityRank(a._priority);
      const pb = priorityRank(b._priority);
      if (pa !== pb) return pa - pb;

      // 2) due_date ASC (nulls last)
      const ad = a._due ? new Date(a._due).getTime() : Number.POSITIVE_INFINITY;
      const bd = b._due ? new Date(b._due).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    };

    (Object.keys(byBucket) as BucketKey[]).forEach((k) => {
      byBucket[k] = byBucket[k].sort(sortFn);
    });

    return byBucket;
  }, [allActionItems]);

  const activeProjectsCount = projects.filter(p => p.status === 'active').length;

  const mOpen = metrics?.open_total ?? 0;
  const mOverdue = metrics?.overdue_total ?? 0;
  const mDeferred = metrics?.deferred_total ?? 0;
  const mDone7 = metrics?.completed_last_7_days ?? 0;

  const statCards: Array<{ label: string; value: number; icon: any; color: string; textColor: string; }> = [
    { label: 'Active Projects', value: activeProjectsCount, icon: Briefcase, color: 'from-blue-500 to-blue-600', textColor: 'text-blue-400' },
    { label: 'Open Items', value: mOpen, icon: ClipboardList, color: 'from-indigo-500 to-indigo-600', textColor: 'text-indigo-400' },
    { label: 'Overdue', value: mOverdue, icon: Clock, color: 'from-red-500 to-red-600', textColor: 'text-danger' },
    { label: 'Deferred', value: mDeferred, icon: Clock, color: 'from-purple-500 to-purple-600', textColor: 'text-purple-400' },
    { label: 'Done (7d)', value: mDone7, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-400' },
  ];

  const quickActions = [
    { label: 'Work Activity', icon: Activity, color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', action: () => onNavigate('daily-logs', { tab: 'activities' }) },
    { label: 'Materials', icon: Package, color: 'bg-purple-500/20 text-purple-600 border-purple-500/30', action: () => onNavigate('daily-logs', { tab: 'materials' }) },
    { label: 'Equipment', icon: Wrench, color: 'bg-primary/20 text-primary border-primary/30', action: () => onNavigate('daily-logs', { tab: 'equipment' }) },
    { label: 'Crew', icon: UserCheck, color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30', action: () => onNavigate('daily-logs', { tab: 'crew' }) },
    { label: 'Visitor', icon: Eye, color: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30', action: () => onNavigate('daily-logs', { tab: 'visitors' }) },
    { label: 'Delivery', icon: Truck, color: 'bg-rose-500/20 text-rose-600 border-rose-500/30', action: () => onNavigate('calendar', { type: 'delivery' }) },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const totalOpen = allActionItems.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-muted-foreground text-sm mt-1">{formatDate(todayStr())} — {todayLogs.length} job{todayLogs.length !== 1 ? 's' : ''} logged today</p>
        </div>
        <button
          onClick={onQuickAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Job
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-card border border-primary/40 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 shadow-md hover:shadow-lg transition-all duration-150 p-4 hover:border-primary/40/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Quick Add</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={i}
                onClick={a.action}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 shadow-md hover:shadow-lg transition-all duration-150 border ${a.color} hover:scale-105 transition-transform`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Active Projects</h2>
            <button onClick={() => onNavigate('daily-logs')} className="text-xs text-primary hover:text-primary/90 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {projects.filter(p => p.status === 'active').length === 0 ? (
              <div className="bg-card border border-primary/40 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 shadow-md hover:shadow-lg transition-all duration-150 p-6 text-center">
                <HardHat className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active projects</p>
                <button onClick={onQuickAdd} className="mt-2 text-xs text-primary hover:text-primary/90">
                  Create your first job
                </button>
              </div>
            ) : (
              projects.filter(p => p.status === 'active').map(p => {
                const projectLogs = todayLogs.filter(l => l.project_id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => onNavigate('daily-logs', { project_id: p.id })}
                    className="w-full text-left bg-card border border-primary/40 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 shadow-md hover:shadow-lg transition-all duration-150 p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {p.job_number || '#'}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mt-1 truncate">{p.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{p.location || p.client || 'No location'}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1 ml-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void carryForwardProject(p.id); }}
                          className="mt-1 text-[10px] px-2 py-1 rounded border border-primary/40 bg-muted hover:bg-muted/70"
                          title="Carry forward overdue items for this project to today"
                        >
                          Carry
                        </button>

                        {projectLogs.length > 0 && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            Logged today
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Command Center */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Command Center</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void carryForwardToToday()}
                disabled={carryBusy}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-primary/40 bg-muted hover:bg-muted/70 text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                title="Carry forward overdue items to today"
              >
                {carryBusy ? 'Carrying…' : 'Carry Forward to Today'}
              </button>
              <span className="text-xs text-muted-foreground">{totalOpen} open item{totalOpen !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {carryNote && (
            <div className="mb-2 text-xs text-muted-foreground">
              {carryNote}
            </div>
          )}

          {totalOpen === 0 ? (
            <div className="bg-card border border-primary/40 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 shadow-md hover:shadow-lg transition-all duration-150 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <p className="text-sm text-foreground font-medium">All clear!</p>
              <p className="text-xs text-muted-foreground mt-1">No outstanding items to show</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {BUCKETS.map((b) => {
                const rows = bucketed[b.key] || [];
                if (rows.length === 0) return null;

                return (
                  <div key={b.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${b.pillClass}`}>
                          {b.title}
                        </span>
                        <span className="text-xs text-muted-foreground">{rows.length}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {rows.slice(0, 50).map((item: any, i: number) => (
                        <button
                          key={`${item.id || 'x'}-${b.key}-${i}`}
                          type="button"
                          onClick={() => openDetail(item)}
                          className={`w-full text-left bg-card border border-primary/40 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 shadow-md hover:shadow-lg transition-all duration-150 p-3 hover:border-primary/40/50 transition-colors ${b.cardLeftBorderClass}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {item._title}
                                </span>
                                <PriorityBadge priority={String(item._priority).toLowerCase()} size="sm" showIcon={false} />
                                {item.category && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {String(item.category)}
                                  </span>
                                )}
                                {item.status && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {String(item.status)}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="truncate">{item._project}</span>
                                {item._jobNumber && <span className="font-mono text-primary/60">#{item._jobNumber}</span>}
                                {item._due && (
  <span className="flex items-center gap-2">
    <span>Due: {formatDate(item._due)}</span>
    {(() => {
      const rel = relativeDayLabel(item._due);
      if (!rel) return null;

      const isOverdue = rel.includes("overdue");
      const isToday = rel === "Today";
      const isTomorrow = rel === "Tomorrow";

      const cls = isOverdue
        ? "bg-danger/20 text-danger border-danger/50"
        : isToday
          ? "bg-primary/20 text-primary border-primary/50"
          : isTomorrow
            ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
            : "bg-muted text-muted-foreground border-border";

      return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cls}`}>
          {rel}
        </span>
      );
    })()}
  </span>
)}
                              </div>

                              {item._details && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">{item._details}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Today's Jobs */}
      {todayLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Today's Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayLogs.map(log => (
              <button
                key={log.id}
                onClick={() => onNavigate('daily-logs', { logId: log.id })}
                className="text-left bg-card border border-primary/40 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 shadow-md hover:shadow-lg transition-all duration-150 p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {log.project?.job_number || '#'}
                  </span>
                  <PriorityBadge priority={log.priority} size="sm" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{log.project?.name || 'Unknown Project'}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {log.weather && <span>{log.weather}</span>}
                  {log.temperature && <span>{log.temperature}</span>}
                </div>
                {log.critical_items && (
                  <div className="mt-2 p-2 rounded-lg bg-danger/10 border border-danger/20">
                    <p className="text-xs text-danger line-clamp-2">{log.critical_items}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <ActionItemDetailModal
        open={detailOpen}
        item={selectedItem}
        onClose={closeDetail}
        onChanged={async () => { await loadData(); }}
      />
    </div>
  );
};

export default DashboardPage;





