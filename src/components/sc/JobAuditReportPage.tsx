import React, { useEffect, useMemo, useState } from "react";
import { Printer, RefreshCw, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Project, DailyLog } from "@/lib/sitecommand-types";
import { formatDate, todayStr } from "@/lib/sitecommand-utils";

type Status = "draft" | "open" | "in_progress" | "blocked" | "done" | "cancelled";

type ActionItemRow = {
  id: string;
  project_id: string | null;
  site_name: string | null;
  title: string | null;
  details: string | null;
  category: string | null;
  priority: string | null;
  status: Status;
  due_date: string | null;
  defer_until: string | null;
  pinned: boolean | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  deleted_at: string | null;
  owner_id: string | null;
};

function daysBetween(aIso: string, bIso: string) {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  const diff = Math.max(0, b - a);
  return diff / (1000 * 60 * 60 * 24);
}

const JobAuditReportPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [from, setFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState<string>(() => todayStr());

  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<ActionItemRow[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Load projects for selector
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProjects((data as any) || []);
        if (!projectId && (data as any)?.[0]?.id) setProjectId((data as any)[0].id);
      } catch (e: any) {
        console.error(e);
      }
    })();
  }, []);

  const generate = async () => {
    if (!projectId) return;
    setLoading(true);
    setErr(null);

    try {
      // 1) project
      const { data: p, error: pErr } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (pErr) throw pErr;
      setProject(p as any);

      // 2) action items (include all statuses, exclude soft-deleted)
      const fromIso = new Date(from + "T00:00:00").toISOString();
      const toIso = new Date(to + "T23:59:59").toISOString();

      const { data: ai, error: aiErr } = await supabase
        .from("action_items")
        .select("*")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .or(
          `and(created_at.gte.${fromIso},created_at.lte.${toIso}),
           and(completed_at.gte.${fromIso},completed_at.lte.${toIso}),
           and(cancelled_at.gte.${fromIso},cancelled_at.lte.${toIso})`
        )
        .order("created_at", { ascending: true });

      if (aiErr) throw aiErr;
      setItems((ai as any) || []);

      // 3) daily logs (date window)
      const { data: dl, error: dlErr } = await supabase
        .from("daily_logs")
        .select("*, project:projects(*)")
        .eq("project_id", projectId)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true });

      if (dlErr) throw dlErr;
      setLogs((dl as any) || []);

      setGeneratedAt(new Date().toISOString());
    } catch (e: any) {
      setErr(e?.message || "Generate failed");
      setProject(null);
      setItems([]);
      setLogs([]);
      setGeneratedAt(null);
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const nowIso = new Date().toISOString();
    const operational = items.filter(i => i.status === "open" || i.status === "in_progress" || i.status === "blocked");
    const done = items.filter(i => i.status === "done");
    const cancelled = items.filter(i => i.status === "cancelled");

    const overdueNow = operational.filter(i => i.due_date && new Date(i.due_date).getTime() < Date.now()).length;

    const doneOverdue = done.filter(i => i.due_date && i.completed_at && new Date(i.due_date).getTime() < new Date(i.completed_at).getTime()).length;

    const avgCompletionDays = (() => {
      const xs = done.filter(i => i.completed_at).map(i => daysBetween(i.created_at, i.completed_at!));
      if (xs.length === 0) return 0;
      return xs.reduce((a,b) => a + b, 0) / xs.length;
    })();

    const highDoneRate = (() => {
      const high = items.filter(i => (i.priority || "").toLowerCase() === "high");
      if (high.length === 0) return 0;
      const highDone = high.filter(i => i.status === "done").length;
      return Math.round((highDone / high.length) * 100);
    })();

    const total = items.length;

    return {
      total,
      operational: operational.length,
      done: done.length,
      cancelled: cancelled.length,
      overdueNow,
      doneOverdue,
      avgCompletionDays: Math.round(avgCompletionDays * 10) / 10,
      highDoneRate,
      generatedAt: generatedAt || nowIso
    };
  }, [items, generatedAt]);

  return (
    <div className="space-y-6 print:bg-white print:text-black print:p-0">
      {/* Header + Controls */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Audit Report</h1>
<button
  onClick={() => window.print()}
  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition print:hidden"
>
  Print Report
</button>
          <p className="text-sm text-muted-foreground mt-1">
            Printable, defensible record of actions and logs for a selected job.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors text-sm"
            title="Print / Save as PDF"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>

          <button
            onClick={generate}
            disabled={loading || !projectId}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition text-sm font-semibold disabled:opacity-60"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 print:hidden">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-3">
          <div className="text-xs font-semibold text-foreground mb-2">Project</div>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.job_number ? `${p.job_number} — ` : ""}{p.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs font-semibold text-foreground mb-2">From</div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs font-semibold text-foreground mb-2">To</div>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          />
        </div>
      </div>

      {err && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 text-sm">
          {err}
        </div>
      )}

      {/* Report */}
      {generatedAt && project && (
        <div className="space-y-6 print:bg-white print:text-black print:p-0">
          {/* Project Header */}
          <div className="bg-card border border-border rounded-xl p-4 print:border-0 print:bg-white print:p-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-foreground">
                  {project.job_number ? `${project.job_number} — ` : ""}{project.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {project.location || project.client || "—"}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Range: {formatDate(from)} → {formatDate(to)}</div>
                <div>Generated: {formatDate(metrics.generatedAt)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground">Total items</div>
                <div className="text-lg font-bold text-foreground">{metrics.total}</div>
              </div>
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground">Open / Active</div>
                <div className="text-lg font-bold text-foreground">{metrics.operational}</div>
              </div>
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground">Done</div>
                <div className="text-lg font-bold text-foreground">{metrics.done}</div>
              </div>
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground">Cancelled</div>
                <div className="text-lg font-bold text-foreground">{metrics.cancelled}</div>
              </div>
            </div>
          </div>

          {/* Action Items Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden print:border-0 print:bg-white">
            <div className="px-4 py-3 border-b border-border print:border-0">
              <div className="text-sm font-semibold text-foreground">Action Items (Full Lifecycle)</div>
              <div className="text-xs text-muted-foreground mt-0.5">Chronological by created date. Soft-deleted excluded.</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs print:text-[11px]">
                <thead className="bg-muted/40">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Due</th>
                    <th className="px-3 py-2">Completed/Cancelled</th>
                    <th className="px-3 py-2">Overdue?</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => {
                    const stamp = i.status === "done" ? i.completed_at : i.status === "cancelled" ? i.cancelled_at : null;
                    const overdueAtStamp = (() => {
                      if (!i.due_date) return "—";
                      const due = new Date(i.due_date).getTime();
                      const ref = stamp ? new Date(stamp).getTime() : Date.now();
                      return due < ref ? "YES" : "no";
                    })();

                    return (
                      <tr key={i.id} className="border-t border-border/60 print:break-inside-avoid">
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(i.created_at)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{i.status}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{i.priority || "—"}</td>
                        <td className="px-3 py-2 min-w-[260px]">
                          <div className="text-foreground font-medium">{i.title || "Unnamed"}</div>
                          {i.details && <div className="text-muted-foreground truncate max-w-[520px]">{i.details}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{i.due_date ? formatDate(i.due_date) : "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{stamp ? formatDate(stamp) : "—"}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{overdueAtStamp}</td>
                      </tr>
                    );
                  })}

                  {items.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-muted-foreground" colSpan={7}>No action items in range.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Logs Summary */}
          <div className="bg-card border border-border rounded-xl overflow-hidden print:border-0 print:bg-white">
            <div className="px-4 py-3 border-b border-border print:border-0">
              <div className="text-sm font-semibold text-foreground">Daily Logs Summary</div>
              <div className="text-xs text-muted-foreground mt-0.5">Chronological by date.</div>
            </div>

            <div className="divide-y divide-border">
              {logs.map((l: any) => (
                <div key={l.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{formatDate(l.date)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {l.weather || "—"} {l.temperature ? `• ${l.temperature}` : ""}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {l.safety_incidents ? <div>Safety incidents: {String(l.safety_incidents)}</div> : <div>Safety incidents: 0</div>}
                    </div>
                  </div>

                  {l.critical_items && (
                    <div className="mt-2 p-2 rounded-lg bg-danger/10 border border-danger/20">
                      <div className="text-xs font-semibold text-danger">Critical</div>
                      <div className="text-xs text-danger">{l.critical_items}</div>
                    </div>
                  )}
                </div>
              ))}

              {logs.length === 0 && (
                <div className="px-4 py-6 text-sm text-muted-foreground">No daily logs in range.</div>
              )}
            </div>
          </div>

          {/* Overdue Analysis */}
          <div className="bg-card border border-border rounded-xl p-4 print:border-0 print:bg-white">
            <div className="text-sm font-semibold text-foreground">Overdue Analysis</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground">Currently overdue</div>
                <div className="text-lg font-bold text-foreground">{metrics.overdueNow}</div>
              </div>
          <div className="mt-8 pt-4 border-t border-border text-[11px] text-muted-foreground print:text-black">
            <div>Generated: {formatDate(metrics.generatedAt)}</div>
            <div>System: Long Line Diary</div>
            <div>Document type: Job Audit Report</div>
          </div>
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground">Done overdue</div>
                <div className="text-lg font-bold text-foreground">{metrics.doneOverdue}</div>
              </div>
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground">Avg completion (days)</div>
                <div className="text-lg font-bold text-foreground">{metrics.avgCompletionDays}</div>
              </div>
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground">High priority done rate</div>
                <div className="text-lg font-bold text-foreground">{metrics.highDoneRate}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!generatedAt && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
          Select a project and date range, then click <span className="text-foreground font-semibold">Generate</span>.
        </div>
      )}
    </div>
  );
};

export default JobAuditReportPage;






