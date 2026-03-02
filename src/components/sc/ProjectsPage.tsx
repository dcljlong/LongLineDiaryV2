import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Search, ArrowRightCircle } from "lucide-react";

import type { Project } from "@/lib/sitecommand-types";
import { fetchProjects } from "@/lib/sitecommand-store";

type Props = {
  onNavigate: (page: string, data?: any) => void;
};

export default function ProjectsPage({ onNavigate }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await fetchProjects();
      setProjects(p || []);
    } catch (e) {
      console.error(e);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return projects;

    return projects.filter((p: any) => {
      const name = String(p?.name || "").toLowerCase();
      const job = String(p?.job_number || "").toLowerCase();
      const site = String(p?.site_name || "").toLowerCase();
      return name.includes(needle) || job.includes(needle) || site.includes(needle);
    });
  }, [projects, q]);

  const activeCount = useMemo(
    () => filtered.filter((p: any) => String(p?.status || "").toLowerCase() === "active").length,
    [filtered]
  );

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
              <Briefcase className="h-5 w-5" />
              Projects
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {filtered.length} total • {activeCount} active
            </div>
          </div>

          <div className="w-[260px] max-w-full">
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, job #, site…"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] d-card-pad shadow-[var(--shadow-1)]">
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No projects found.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p: any) => {
              const status = String(p?.status || "").toLowerCase();
              const isActive = status === "active";

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onNavigate("action-items", { projectId: String(p.id) })}
                  className="w-full rounded-md border p-3 text-left hover:bg-[hsl(var(--surface-hover))]"
                  title="Open Action Items filtered to this project"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="truncate font-medium">
                          {p?.name || "Unnamed Project"}
                        </div>

                        <span
                          className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${
                            isActive
                              ? "text-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.14)] border-[hsl(var(--status-success)/0.35)]"
                              : "text-muted-foreground bg-muted/60 border-border/60"
                          }`}
                        >
                          {status || "unknown"}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground truncate">
                        {p?.job_number ? `Job ${p.job_number}` : ""}
                        {p?.site_name ? `${p?.job_number ? " • " : ""}${p.site_name}` : ""}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowRightCircle className="h-4 w-4" />
                      <span>Items</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
