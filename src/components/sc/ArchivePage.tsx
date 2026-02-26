import React, { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, CheckCircle2, Ban } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate, todayStr } from "@/lib/sitecommand-utils";
import ActionItemDetailModal from "./ActionItemDetailModal";

type Status = "done" | "cancelled";

type Row = {
  id: string;
  company_id: string;
  project_id: string | null;
  site_name: string | null;
  title: string | null;
  details: string | null;
  category: string | null;
  priority: string | null;
  status: Status;
  due_date: string | null;
  pinned: boolean | null;
  source: string | null;
  source_ref: any;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  deleted_at: string | null;
};

const ArchivePage: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState<string>(() => {
    // default last 30 days
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("action_items")
        .select("*")
        .in("status", ["done", "cancelled"])
        .is("deleted_at", null)
        .gte("updated_at", new Date(from).toISOString())
        .order("updated_at", { ascending: false })
        .limit(500);

      const { data, error } = await query;
      if (error) throw error;
      setRows((data as any) || []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return rows
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter((r) => {
        if (!qq) return true;
        const hay = `${r.title || ""} ${r.details || ""} ${r.site_name || ""}`.toLowerCase();
        return hay.includes(qq);
      });
  }, [rows, statusFilter, q]);

  const openDetail = (r: any) => {
    setSelected({
      ...r,
      _title: r.title || "Unnamed",
      _details: r.details || "",
      _project: r.site_name || "—",
      _jobNumber: "",
      _due: r.due_date,
      _pinned: r.pinned === true,
      _priority: r.priority || "medium",
    });
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelected(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Archive</h1>
          <p className="text-sm text-muted-foreground mt-1">Completed and cancelled items retained for reporting.</p>
        </div>

        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-3">
          <div className="text-xs font-semibold text-foreground mb-2">Search</div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Title / details / site..."
              className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs font-semibold text-foreground mb-2">Status</div>
          <div className="flex gap-1">
            {(["all", "done", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  statusFilter === s
                    ? "bg-muted text-foreground border-border"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                {s === "all" ? "All" : s === "done" ? "Done" : "Cancelled"}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3">
          <div className="text-xs font-semibold text-foreground mb-2">From</div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-foreground"
          />
          <div className="mt-2">
            <button
              onClick={load}
              className="w-full px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold text-foreground">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</div>
          <div className="text-xs text-muted-foreground">Today: {formatDate(todayStr())}</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">No archived items found</span>
            </div>
          </div>
        ) : (
          <div className="max-h-[560px] overflow-y-auto">
            {filtered.map((r) => {
              const isDone = r.status === "done";
              const stamp = isDone ? r.completed_at : r.cancelled_at;

              return (
                <button
                  key={r.id}
                  onClick={() => openDetail(r)}
                  className="w-full text-left px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">{r.title || "Unnamed"}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          isDone ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"
                        }`}>
                          {isDone ? "Done" : "Cancelled"}
                        </span>
                        {r.priority && (
                          <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted text-muted-foreground">
                            {r.priority}
                          </span>
                        )}
                        {r.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded border border-border bg-muted text-muted-foreground">
                            {r.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="truncate">{r.site_name || "—"}</span>
                        {r.due_date && <span>Due: {formatDate(r.due_date)}</span>}
                        {stamp && <span>{isDone ? "Completed" : "Cancelled"}: {formatDate(stamp)}</span>}
                      </div>

                      {r.details && (
                        <div className="mt-1 text-xs text-muted-foreground truncate">{r.details}</div>
                      )}
                    </div>

                    <div className="pt-1">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <Ban className="w-4 h-4 text-danger" />
                      )}
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
        item={selected}
        onClose={closeDetail}
        onChanged={async () => { await load(); }}
      />
    </div>
  );
};

export default ArchivePage;
