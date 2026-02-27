import React, { useEffect, useMemo, useState } from "react";
import { X, CheckCircle2, Ban, PauseCircle, PlayCircle, AlertOctagon } from "lucide-react";
import type { ActionItemStatus } from "@/lib/action-item-transitions";
import { transitionActionItem, setActionItemDeferUntil } from "@/lib/action-item-transitions";
import { formatDate, todayStr } from "@/lib/sitecommand-utils";
import { supabase } from "@/lib/supabase";
import PriorityBadge from "./PriorityBadge";

type BucketKey = "overdue" | "due_today" | "upcoming" | "no_due_date";

export type ActionItemRow = {
  id: string;
  title?: string | null;
  details?: string | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  due_date?: string | null;
  defer_until?: string | null;
  bucket?: BucketKey | null;
  source?: string | null;
  source_ref?: any;
  completed_at?: string | null;
  cancelled_at?: string | null;

  // dashboard normalization fields we injected
  _title?: string;
  _details?: string;
  _project?: string;
  _jobNumber?: string;
  _due?: string | null;
  _priority?: string;
};

interface Props {
  open: boolean;
  item: ActionItemRow | null;
  onClose: () => void;
  onChanged: () => Promise<void> | void; // refresh callback
}

type AuditRow = {
  id: number;
  action: string;
  action_item_id: string;
  owner_id: string;
  changed_by: string | null;
  changed_at: string;
  old_row: any | null;
  new_row: any | null;
};

function normalizeStatus(s: any): ActionItemStatus {
  const v = String(s || "open").toLowerCase();
  if (v === "open") return "open";
  if (v === "in_progress") return "in_progress";
  if (v === "blocked") return "blocked";
  if (v === "done") return "done";
  if (v === "cancelled") return "cancelled";
  return "open";
}

function normalizePriority(p: any): "critical" | "high" | "medium" | "low" {
  const v = String(p || "medium").toLowerCase();
  if (v === "critical") return "critical";
  if (v === "high") return "high";
  if (v === "low") return "low";
  return "medium";
}

function addDaysIso(d: string, days: number): string {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

function shortId(id: string | null | undefined): string {
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function fmtTs(ts: string): string {
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

export default function ActionItemDetailModal({ open, item, onClose, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditErr, setAuditErr] = useState<string | null>(null);

  const view = useMemo(() => {
    if (!item) return null;

    const title = item._title || item.title || "Unnamed";
    const details = item._details || item.details || "";
    const due = item._due || item.due_date || null;

    return {
      id: item.id,
      title,
      details,
      project: item._project || "Unknown",
      jobNumber: item._jobNumber || "",
      due,
      status: normalizeStatus(item.status),
      priority: normalizePriority(item._priority || item.priority),
      category: item.category ? String(item.category) : null,
      source: item.source ? String(item.source) : null,
      sourceRef: item.source_ref ?? null,
      completedAt: item.completed_at || null,
      cancelledAt: item.cancelled_at || null,
      deferUntil: item.defer_until || null,
    };
  }, [item]);

  const [deferDate, setDeferDate] = useState<string>(() => {
    if (view?.deferUntil) return view.deferUntil;
    return todayStr();
  });

  useEffect(() => {
    if (!open || !view?.id) return;

    const loadAudit = async () => {
      setAuditLoading(true);
      setAuditErr(null);
      try {
        const { data, error } = await supabase
          .from("action_item_audit")
          .select("id,action,action_item_id,owner_id,changed_by,changed_at,old_row,new_row")
          .eq("action_item_id", view.id)
          .order("changed_at", { ascending: false })
          .limit(25);

        if (error) throw error;
        setAudit((data || []) as any);
      } catch (e: any) {
        setAuditErr(e?.message || "Audit load failed");
        setAudit([]);
      } finally {
        setAuditLoading(false);
      }
    };

    loadAudit();
  }, [open, view?.id]);

  if (!open || !view) return null;

  const doTransition = async (target: ActionItemStatus) => {
    setBusy(true);
    setErr(null);
    try {
      await transitionActionItem(view.id, target);
      await onChanged();
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const doDefer = async (iso: string | null) => {
    setBusy(true);
    setErr(null);
    try {
      await setActionItemDeferUntil(view.id, iso);
      await onChanged();
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Defer failed");
    } finally {
      setBusy(false);
    }
  };

  const setQuick = (days: number) => {
    const base = todayStr();
    const iso = addDaysIso(base, days);
    setDeferDate(iso);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={() => (busy ? null : onClose())}
      />

      {/* modal */}
      <div className="absolute inset-x-0 top-10 mx-auto w-[95%] max-w-2xl">
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-start justify-between p-4 border-b border-border">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-foreground truncate">{view.title}</h3>

                <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted text-muted-foreground">
                  {view.status}
                </span>

                <PriorityBadge priority={view.priority} size="sm" showIcon />

                {view.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted text-muted-foreground">
                    {view.category}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="truncate">{view.project}</span>
                {view.jobNumber && <span className="font-mono text-primary/70">#{view.jobNumber}</span>}
                {view.due && <span>Due: {formatDate(view.due)}</span>}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => (busy ? null : onClose())}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {err && (
              <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                {err}
              </div>
            )}

            {view.details ? (
              <div className="bg-muted/40 border border-border rounded-xl p-3">
                <div className="text-xs font-semibold text-foreground mb-1">Details</div>
                <div className="text-sm text-foreground whitespace-pre-wrap">{view.details}</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No details</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="text-xs font-semibold text-foreground mb-1">Operational</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Status: <span className="text-foreground">{view.status}</span></div>
                  <div>Priority: <span className="text-foreground">{view.priority}</span></div>
                  {view.deferUntil && <div>Defer until: <span className="text-foreground">{formatDate(view.deferUntil)}</span></div>}
                  {view.completedAt && <div>Completed: <span className="text-foreground">{formatDate(view.completedAt)}</span></div>}
                  {view.cancelledAt && <div>Cancelled: <span className="text-foreground">{formatDate(view.cancelledAt)}</span></div>}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-3">
                <div className="text-xs font-semibold text-foreground mb-1">Source</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Source: <span className="text-foreground">{view.source || "—"}</span></div>
                  <div className="break-words">
                    Ref: <span className="text-foreground">{view.sourceRef ? JSON.stringify(view.sourceRef) : "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit history */}
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-foreground">History</div>
                {auditLoading && <span className="text-[11px] text-muted-foreground">Loading…</span>}
              </div>

              {auditErr && (
                <div className="mt-2 text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                  {auditErr}
                </div>
              )}

              {!auditLoading && !auditErr && audit.length === 0 && (
                <div className="mt-2 text-xs text-muted-foreground">No history yet</div>
              )}

              {!auditErr && audit.length > 0 && (
                <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {audit.map((a) => (
                    <div key={a.id} className="border border-border rounded-lg p-2 bg-muted/30">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted text-muted-foreground">
                          {a.action}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{fmtTs(a.changed_at)}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        By: <span className="text-foreground">{shortId(a.changed_by)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Defer controls */}
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-foreground">Defer</div>
                {view.deferUntil ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => doDefer(null)}
                    className="text-xs px-2 py-1 rounded-lg border border-border bg-muted hover:bg-muted/60 transition-colors"
                    title="Clear defer"
                  >
                    Clear
                  </button>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Not deferred</span>
                )}
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={deferDate}
                    onChange={(e) => setDeferDate(e.target.value)}
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  />
                  <button
                    type="button"
                    disabled={busy || !deferDate}
                    onClick={() => doDefer(deferDate)}
                    className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
                  >
                    Apply
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => setQuick(1)} className="text-xs px-2 py-1 rounded-lg border border-border bg-muted hover:bg-muted/60">+1d</button>
                  <button type="button" disabled={busy} onClick={() => setQuick(3)} className="text-xs px-2 py-1 rounded-lg border border-border bg-muted hover:bg-muted/60">+3d</button>
                  <button type="button" disabled={busy} onClick={() => setQuick(7)} className="text-xs px-2 py-1 rounded-lg border border-border bg-muted hover:bg-muted/60">+7d</button>
                  <button type="button" disabled={busy} onClick={() => setQuick(14)} className="text-xs px-2 py-1 rounded-lg border border-border bg-muted hover:bg-muted/60">+14d</button>
                </div>
              </div>
            </div>

            {/* Status transitions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button type="button" disabled={busy} onClick={() => doTransition("open")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted hover:bg-muted/60 text-sm">
                <PlayCircle className="w-4 h-4" /> Open
              </button>
              <button type="button" disabled={busy} onClick={() => doTransition("in_progress")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted hover:bg-muted/60 text-sm">
                <AlertOctagon className="w-4 h-4" /> In Progress
              </button>
              <button type="button" disabled={busy} onClick={() => doTransition("blocked")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted hover:bg-muted/60 text-sm">
                <PauseCircle className="w-4 h-4" /> Blocked
              </button>
              <button type="button" disabled={busy} onClick={() => doTransition("done")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted hover:bg-muted/60 text-sm">
                <CheckCircle2 className="w-4 h-4" /> Done
              </button>
              <button type="button" disabled={busy} onClick={() => doTransition("cancelled")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted hover:bg-muted/60 text-sm col-span-2 md:col-span-4">
                <Ban className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
