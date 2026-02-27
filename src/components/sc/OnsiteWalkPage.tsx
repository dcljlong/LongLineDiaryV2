import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createActionItem,
  createProject,
  fetchRecentActionItems,
  fetchProjects,
} from "@/lib/sitecommand-store";
import type { Project } from "@/lib/sitecommand-types";
import { supabase } from "@/lib/supabase";

type Priority = "critical" | "high" | "medium" | "low";

const STORAGE_LAST_PROJECT = "lldv2-onsitewalk-last-project";

const TYPES = [
  "To Do",
  "Question",
  "Materials",
  "Safety",
  "Defect",
  "Observation",
  "Delivery",
] as const;

export default function OnsiteWalkPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("To Do");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<string>("");

  const [recent, setRecent] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auth-derived company_id fallback (to satisfy DB NOT NULL)
  const [uid, setUid] = useState<string>("");

  // Quick add job
  const [jobOpen, setJobOpen] = useState(false);
  const [jobName, setJobName] = useState("");
  const [jobBusy, setJobBusy] = useState(false);
  const [jobErr, setJobErr] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const jobRef = useRef<HTMLInputElement>(null);

  const projectById = useMemo(() => {
    const map = new Map<string, Project>();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  useEffect(() => {
    load();

    // default due date = tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDueDate(d.toISOString().slice(0, 10));

    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const persistProject = (id: string) => {
    try {
      localStorage.setItem(STORAGE_LAST_PROJECT, id);
    } catch {
      // ignore
    }
  };

  const refreshRecent = async (pid: string) => {
    const r = await fetchRecentActionItems({ project_id: pid || undefined, limit: 10 });
    setRecent(r);
  };

  const load = async () => {
    setErrorMsg(null);

    // Get auth user (used as company_id fallback)
    const ures = await supabase.auth.getUser();
    const u = ures?.data?.user;
    setUid(u?.id ?? "");

    const p = await fetchProjects();
    setProjects(p);

    const saved =
      (typeof window !== "undefined" ? localStorage.getItem(STORAGE_LAST_PROJECT) : null) || "";
    const validSaved = saved && p.some((x) => x.id === saved);

    const chosen = validSaved ? saved : (p[0]?.id ?? "");
    setProjectId(chosen);

    const r = await fetchRecentActionItems({ project_id: chosen || undefined, limit: 10 });
    setRecent(r);
  };

  const applySmartDefaults = (t: (typeof TYPES)[number]) => {
    // priority defaults
    if (t === "Safety") setPriority("critical");
    if (t === "Defect") setPriority("high");
    if (t === "Delivery") setPriority("medium");
    if (t === "Materials") setPriority("medium");

    // due date nudges
    if (t === "Materials") {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      setDueDate(d.toISOString().slice(0, 10));
    }
    if (t === "Safety") {
      const d = new Date();
      d.setDate(d.getDate() + 0);
      setDueDate(d.toISOString().slice(0, 10));
    }
  };

  const onProjectChange = async (id: string) => {
    setProjectId(id);
    persistProject(id);
    await refreshRecent(id);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const t = title.trim();
    if (!t) {
      setErrorMsg("Description is required.");
      inputRef.current?.focus();
      return;
    }
    if (!projectId) {
      setErrorMsg("Project is required.");
      return;
    }
    if (!uid) {
      setErrorMsg("Not signed in. Refresh and sign in again.");
      return;
    }
    if (busy) return;

    setBusy(true);
    try {
      await createActionItem({
        project_id: projectId,
        title: t,
        details: null,
        category: type,
        priority,
        status: "open",
        due_date: dueDate || null,
        source: "onsite_walk",
        source_ref: { type },
      });

      try {
        window.dispatchEvent(new CustomEvent("lldv2:action-items-changed", { detail: { project_id: projectId } }));
      } catch {
        // ignore
      }

      setTitle("");
      await refreshRecent(projectId);
      inputRef.current?.focus();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save entry.");
    } finally {
      setBusy(false);
    }
  };

  const openJob = () => {
    setJobErr(null);
    setJobOpen(true);
    setTimeout(() => jobRef.current?.focus(), 0);
  };

  const cancelJob = () => {
    setJobErr(null);
    setJobName("");
    setJobOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const submitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobErr(null);

    const name = jobName.trim();
    if (!name) {
      setJobErr("Job name is required.");
      jobRef.current?.focus();
      return;
    }
    if (jobBusy) return;

    setJobBusy(true);
    try {
      const created = await createProject({ name, status: "active" });

      const p = await fetchProjects();
      setProjects(p);

      setProjectId(created.id);
      persistProject(created.id);

      setJobName("");
      setJobOpen(false);

      await refreshRecent(created.id);

      try {
        window.dispatchEvent(new CustomEvent("lldv2:projects-changed", { detail: { project_id: created.id } }));
      } catch {
        // ignore
      }

      inputRef.current?.focus();
    } catch (err: any) {
      setJobErr(err?.message || "Failed to create job.");
    } finally {
      setJobBusy(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-foreground">Onsite Walk</h1>
          <div className="flex items-center gap-2">
            {!jobOpen && (
              <button
                type="button"
                onClick={openJob}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/70 text-foreground"
                title="Create a new job"
              >
                New Job
              </button>
            )}
          </div>
        </div>

        {jobOpen && (
          <form onSubmit={submitJob} className="border border-border rounded-xl p-3 space-y-2 bg-muted/30">
            <div className="text-xs font-semibold text-foreground">Create Job</div>

            <input
              ref={jobRef}
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
              placeholder="Job name…"
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
            />

            {jobErr && <div className="text-xs text-red-500">{jobErr}</div>}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelJob}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-transparent hover:bg-muted/40 text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={jobBusy}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50"
              >
                {jobBusy ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            value={projectId}
            onChange={(e) => void onProjectChange(e.target.value)}
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            {projects.length === 0 && <option value="">No projects</option>}
          </select>

          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="One-line entry (press Enter to save)…"
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={type}
              onChange={(e) => {
                const v = e.target.value as (typeof TYPES)[number];
                setType(v);
                applySmartDefaults(v);
              }}
              className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
          />

          {errorMsg && (
            <div className="text-xs text-red-500">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold"
          >
            {busy ? "Saving..." : "Add Entry"}
          </button>

          <div className="text-xs text-muted-foreground">
            Current project: <span className="text-foreground">{projectById.get(projectId)?.name ?? "—"}</span>
          </div>
        </form>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Entries</h2>
          <div className="text-xs text-muted-foreground">
            Showing last {Math.min(recent.length, 10)}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {recent.map((r) => (
            <div key={r.id} className="border border-border rounded-lg p-2">
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">
                {r.category} • {r.priority} • {r.status}
                {r.due_date ? ` • Due ${r.due_date}` : ""}
              </div>
            </div>
          ))}

          {recent.length === 0 && (
            <div className="text-xs text-muted-foreground">No entries yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}


