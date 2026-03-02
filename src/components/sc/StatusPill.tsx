import * as React from "react";

export type StatusPillStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "deferred"
  | "completed"
  | "overdue";

type Props = {
  status: StatusPillStatus;
  label?: string;
  className?: string;
  title?: string;
};

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

function tokenForStatus(status: StatusPillStatus) {
  switch (status) {
    case "completed":
      return "var(--status-success)";
    case "overdue":
    case "blocked":
      return "var(--status-danger)";
    case "deferred":
      return "var(--status-warning)";
    case "in_progress":
      return "var(--status-info)";
    case "open":
    default:
      return "var(--primary)";
  }
}

function defaultLabel(status: StatusPillStatus) {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "blocked":
      return "Blocked";
    case "deferred":
      return "Deferred";
    case "completed":
      return "Completed";
    case "overdue":
      return "Overdue";
    default:
      return status;
  }
}

export function StatusPill({ status, label, className, title }: Props) {
  const tok = tokenForStatus(status);

  return (
    <span
      title={title}
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold",
        "select-none whitespace-nowrap",
        "shadow-[0_0_12px_currentColor/0.25]",
        className
      )}
      style={{
        color: `hsl(${tok})`,
        backgroundColor: `hsl(${tok} / 0.56)`,
        borderColor: `hsl(${tok} / 0.98)`,
      }}
      data-status={status}
    >
      {label ?? defaultLabel(status)}
    </span>
  );
}

export default StatusPill;
