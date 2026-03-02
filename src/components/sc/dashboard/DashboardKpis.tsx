import * as React from "react";

export type DashboardKpiCard = {
  key: string;
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
};

type Props = {
  statCards: DashboardKpiCard[];
  onNavigate: (route: string, params?: any) => void;
};

export default function DashboardKpis({ statCards, onNavigate }: Props) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
      {statCards.map((s) => (
        <div
          key={s.key}
          onClick={() => {
            if (s.key === "projects") onNavigate("projects");
            else onNavigate("action-items", { filter: s.key });
          }}
          className={`rounded-xl border p-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${
            s.key === "projects" ? "bg-[hsl(var(--primary)/0.24)] border-[hsl(var(--primary)/0.90)]" : ""
          } ${
            s.key === "overdue" ? "bg-[hsl(var(--status-danger)/0.28)] border-[hsl(var(--status-danger)/0.95)]" : ""
          } ${
            s.key === "open" ? "bg-[hsl(var(--status-info)/0.28)] border-[hsl(var(--status-info)/0.90)]" : ""
          } ${
            s.key === "deferred" ? "bg-[hsl(var(--status-warning)/0.28)] border-[hsl(var(--status-warning)/0.90)]" : ""
          } ${
            s.key === "done7" ? "bg-[hsl(var(--status-success)/0.28)] border-[hsl(var(--status-success)/0.90)]" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
          <div className="mt-2 text-3xl font-bold">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
