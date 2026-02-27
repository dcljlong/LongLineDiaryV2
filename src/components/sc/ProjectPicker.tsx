import React from "react";
import type { Project } from "@/lib/sitecommand-types";

type Props = {
  projects: Project[];
  value: string | null | "";
  onChange: (projectId: string | null) => void;
  className?: string;
  includeBlank?: boolean;
  blankLabel?: string;
  disabled?: boolean;
};

export default function ProjectPicker({
  projects,
  value,
  onChange,
  className,
  includeBlank = true,
  blankLabel = "No project",
  disabled = false,
}: Props) {
  return (
    <select
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value ? e.target.value : null)}
      className={className}
    >
      {includeBlank && <option value="">{blankLabel}</option>}
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
