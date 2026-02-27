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
        "bg-red-500/15 text-red-500 border border-red-500/30",
    },
    high: {
      label: "High",
      icon: AlertTriangle,
      className:
        "bg-orange-500/15 text-orange-500 border border-orange-500/30",
    },
    medium: {
      label: "Medium",
      icon: AlertCircle,
      className:
        "bg-yellow-500/15 text-yellow-500 border border-yellow-500/30",
    },
    low: {
      label: "Low",
      icon: CheckCircle2,
      className:
        "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
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
