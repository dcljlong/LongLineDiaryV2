import React from "react";
import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

export type PriorityLevel = "critical" | "high" | "medium" | "low";

interface PriorityBadgeProps {
  priority: PriorityLevel | string | null | undefined;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = "sm",
  showIcon = true,
}) => {
  const normalize = (p: any): PriorityLevel => {
    const v = String(p || "").toLowerCase();
    if (v === "critical") return "critical";
    if (v === "high") return "high";
    if (v === "medium") return "medium";
    if (v === "low") return "low";
    return "low";
  };

  const p = normalize(priority);

  const config: Record<
    PriorityLevel,
    {
      label: string;
      icon: React.ElementType;
      className: string;
    }
  > = {
    critical: {
      label: "Critical",
      icon: AlertOctagon,
      className:
        "bg-[hsl(var(--status-danger)/0.12)] text-[hsl(var(--status-danger))] border border-[hsl(var(--status-danger)/0.28)]",
    },
    high: {
      label: "High",
      icon: AlertTriangle,
      className:
        "bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))] border border-[hsl(var(--status-warning)/0.28)]",
    },
    medium: {
      label: "Medium",
      icon: AlertCircle,
      className:
        "bg-[hsl(var(--status-info)/0.12)] text-[hsl(var(--status-info))] border border-[hsl(var(--status-info)/0.28)]",
    },
    low: {
      label: "Low",
      icon: CheckCircle2,
      className:
        "bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))] border border-[hsl(var(--status-success)/0.28)]",
    },
  };

  const Icon = config[p].icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold capitalize ${config[p].className} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      {config[p].label}
    </span>
  );
};

export default PriorityBadge;





