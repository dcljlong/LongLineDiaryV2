import * as React from "react";

type Props = {
  activeProjectsCount: number;
  activeProjects: any[];
  onNavigate: (route: string, params?: any) => void;
  onProjectClick?: (projectId: string) => void;
};

export default function DashboardJobsStrip({
  activeProjectsCount,
  activeProjects,
  onNavigate,
  onProjectClick,
}: Props) {
  const go = (id: any) => {
    const pid = String(id);
    if (onProjectClick) return onProjectClick(pid);
    return onNavigate("action-items", { projectId: pid });
  };

  return (
    <>
      {/* Jobs strip */}
      {activeProjectsCount > 0 && (
        <div className="rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] d-card-pad shadow-[var(--shadow-1)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Jobs</div>
            <button
              type="button"
              onClick={() => onNavigate("projects")}
              className="text-xs text-primary hover:underline"
              title="View all projects"
            >
              View all
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {activeProjects.map((p: any) => (
              <button
                key={p.id}
                type="button"
                onClick={() => go(p.id)}
                className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-semibold hover:bg-[hsl(var(--surface-hover))] max-w-[260px]"
                title="Filter action items to this job"
              >
                <span className="truncate">{p.name || "Unnamed Job"}</span>
                {p.job_number ? (
                  <span className="text-[10px] font-mono text-muted-foreground">{p.job_number}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
