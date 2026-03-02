import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Clock, Filter, Briefcase } from "lucide-react";

import { formatDate, relativeDayLabel, todayStr } from "@/lib/sitecommand-utils";
import { fetchAllIncompleteItems } from "@/lib/sitecommand-store";
import PriorityBadge from "./PriorityBadge";
import ActionItemDetailModal from "./ActionItemDetailModal";

type Props = {
  initialData?: any;
};

type BucketKey = "overdue" | "due_today" | "upcoming" | "no_due_date";

type IncompleteItems = {
  activities: any[];
  materials: any[];
  equipment: any[];
  crew: any[];
};

function toDateOnlyStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeBucketFallback(dueDate: any): BucketKey {
  if (!dueDate) return "no_due_date";
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return "no_due_date";

  const today = new Date();
  const todayStrLocal = toDateOnlyStr(today);
  const dueStrLocal = toDateOnlyStr(due);

  if (dueStrLocal < todayStrLocal) return "overdue";
  if (dueStrLocal === todayStrLocal) return "due_today";
  return "upcoming";
}

function priorityRank(p?: string | null): number {
  if (!p) return 3;
  const v = String(p).toLowerCase();
  if (v === "critical") return 0;
  if (v === "high") return 1;
  if (v === "medium") return 2;
  if (v === "low") return 3;
  return 3;
}

function normalizeItem(raw: any) {
  const due = raw.due_date ?? raw.required_date ?? null;
  const bucket: BucketKey = (raw.bucket as BucketKey) || computeBucketFallback(due);

  const projectId =
    raw.project_id ??
    raw.projects?.id ??
    raw.project?.id ??
    raw.daily_logs?.projects?.id ??
    raw._projectId ??
    null;

  const projectName =
    raw.daily_logs?.projects?.name ??
    raw.project?.name ??
    raw.projects?.name ??
    raw._project ??
    "Unknown";

  const jobNumber =
    raw.daily_logs?.projects?.job_number ??
    raw.project?.job_number ??
    raw.projects?.job_number ??
    raw._jobNumber ??
    "";

  const title = raw.title ?? raw.description ?? raw.equipment_name ?? raw.worker_name ?? "Unnamed";
  const details = raw.details ?? raw.notes ?? raw.note ?? "";
  const priority = raw.priority ?? raw._priority ?? "medium";

  return {
    ...raw,
    _bucket: bucket,
    _due: due,
    _projectId: projectId ? String(projectId) : "",
    _project: String(projectName),
    _jobNumber: String(jobNumber),
    _title: String(title),
    _details: String(details),
    _priority: String(priority),
  };
}

export default function ActionItemsPage({ initialData }: Props) {
  const [incomplete, setIncomplete] = useState<IncompleteItems | null>(null);
  const [loading, setLoading] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const filterKey = String(initialData?.filter || "").trim();     // 'open' | 'overdue' | 'deferred' | 'done7'
  const projectId = initialData?.projectId ? String(initialData.projectId) : "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const inc = await fetchAllIncompleteItems();
      setIncomplete(inc as any);
    } catch (e) {
      console.error(e);
      setIncomplete({ activities: [], materials: [], equipment: [], crew: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const handler = () => void load();
    window.addEventListener("lldv2:action-items-changed", handler as EventListener);
    return () => window.removeEventListener("lldv2:action-items-changed", handler as EventListener);
  }, [load]);

  const allItems = useMemo(() => {
    if (!incomplete) return [];
    const items = [
      ...(incomplete.activities || []),
      ...(incomplete.materials || []),
      ...(incomplete.equipment || []),
      ...(incomplete.crew || []),
    ].map(normalizeItem);

    // Dashboard behavior: hide items deferred into the future
    const today = todayStr();
    return items.filter((it: any) => !it.defer_until || it.defer_until <= today);
  }, [incomplete]);

  const filtered = useMemo(() => {
    let items = [...allItems];

    if (projectId) {
      items = items.filter((it: any) => String(it._projectId || "") === projectId);
    }

    if (filterKey === "overdue") {
      items = items.filter((it: any) => it._bucket === "overdue");
    } else if (filterKey === "open") {
      // keep all (already incomplete)
    } else if (filterKey === "deferred") {
      // NOTE: dashboard currently sets deferred=0; treat as "has defer_until in future" (if any exist in DB)
      const today = todayStr();
      items = items.filter((it: any) => it.defer_until && it.defer_until > today);
    } else if (filterKey === "done7") {
      // Not available from fetchAllIncompleteItems (by definition); show empty until Phase B adds completed query.
      items = [];
    }

    items.sort((a: any, b: any) => {
      const pa = priorityRank(a._priority);
      const pb = priorityRank(b._priority);
      if (pa !== pb) return pa - pb;

      const ad = a._due ? new Date(a._due).getTime() : Number.POSITIVE_INFINITY;
      const bd = b._due ? new Date(b._due).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    });

    return items;
  }, [allItems, filterKey, projectId]);

  const title = projectId ? "Action Items (Job)" : "Action Items";
  const subtitleParts: string[] = [];
  if (filterKey) subtitleParts.push(`Filter: ${filterKey}`);
  if (projectId) subtitleParts.push(`ProjectId: ${projectId}`);
  const subtitle = subtitleParts.join(" • ");

  const openDetail = (item: any) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="d-space-y">
      <div className="rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] d-card-pad shadow-[var(--shadow-1)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {title}
            </div>
            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              {subtitle || "All incomplete items"}
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex items-center gap-2">
            {projectId ? <Briefcase className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            <span>{filtered.length} items</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] d-card-pad shadow-[var(--shadow-1)]">
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No items for this view.</div>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 200).map((it: any) => {
              const dueLabel = it._due ? `${formatDate(it._due)} (${relativeDayLabel(it._due)})` : "No due date";
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
                      {it._details ? (
                        <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it._details}</div>
                      ) : null}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {it._project}
                        {it._jobNumber ? ` • ${it._jobNumber}` : ""}
                        {it._due ? ` • Due ${dueLabel}` : " • No due date"}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <PriorityBadge priority={it._priority} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ActionItemDetailModal
        open={detailOpen}
        item={selectedItem}
        onClose={() => { setDetailOpen(false); setSelectedItem(null); }}
        onChanged={async () => { await load(); }}
      />
    </div>
  );
}
