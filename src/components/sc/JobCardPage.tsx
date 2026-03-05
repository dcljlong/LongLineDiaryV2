import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2, Save, ListChecks, BookOpen, CalendarDays } from 'lucide-react';
import type { Project } from '@/lib/sitecommand-types';
import { supabase } from '@/lib/supabase';
import { updateProject, deleteProject } from '@/lib/sitecommand-store';

type Props = {
  initialData?: { projectId?: string } | null;
  onNavigate: (page: string, data?: any) => void;
};

const statusOptions = ['active', 'on-hold', 'complete', 'archived'] as const;

export default function JobCardPage({ initialData, onNavigate }: Props) {
  const projectId = String(initialData?.projectId || '');

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // editable fields
  const [name, setName] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [siteName, setSiteName] = useState('');
  const [location, setLocation] = useState('');
  const [client, setClient] = useState('');
  const [status, setStatus] = useState('active');

  const load = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (res.error) throw res.error;
      const p: any = res.data || null;
      setProject(p);

      setName(String(p?.name || ''));
      setJobNumber(String(p?.job_number || ''));
      setSiteName(String(p?.site_name || ''));
      setLocation(String(p?.location || ''));
      setClient(String(p?.client || ''));
      setStatus(String(p?.status || 'active'));
    } catch (e) {
      console.error(e);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  const title = useMemo(() => {
    const n = (name || project?.name || '').trim();
    const j = (jobNumber || project?.job_number || '').trim();
    return j ? `${j} ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ${n || 'Unnamed Job'}` : (n || 'Unnamed Job');
  }, [name, jobNumber, project]);

    const canSave = useMemo(() => {
    if (!project) return false;
    return (
      String(name) !== String(project?.name || '') ||
      String(jobNumber) !== String(project?.job_number || '') ||
      String(siteName) !== String(project?.site_name || '') ||
      String(location) !== String(project?.location || '') ||
      String(client) !== String(project?.client || '') ||
      String(status) !== String(project?.status || 'active')
    );
  }, [project, name, jobNumber, siteName, location, client, status]);
const onSave = useCallback(async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await updateProject(projectId, {
        name,
        job_number: jobNumber,
        site_name: siteName,
        location,
        client,
        status,
      } as any);

      await load();
    } catch (e: any) {
      console.error(e);
      window.alert('Save failed.\n\n' + String(e?.message || e?.details || e || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, [projectId, name, jobNumber, siteName, location, client, status, load]);
const onDelete = useCallback(async () => {
    if (!projectId) return;
    const ok = window.confirm('Delete this job?\n\nThis will permanently delete the job and related records.');
    if (!ok) return;

    setDeleting(true);
    try {
      await deleteProject(projectId);
      onNavigate('dashboard');
    } catch (e: any) {
      console.error(e);
      window.alert('Delete failed.\n\n' + String(e?.message || e?.details || e || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  }, [projectId, onNavigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="d-space-y">
        <div className="rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] d-card-pad shadow-[var(--shadow-1)]">
          <div className="text-lg font-semibold">Job Card</div>
          <div className="mt-1 text-sm text-muted-foreground">No job selected.</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="d-space-y">
        <div className="rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] d-card-pad shadow-[var(--shadow-1)]">
          <div className="text-lg font-semibold">Job Card</div>
          <div className="mt-1 text-sm text-muted-foreground">Job not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-space-y">
      <div className="rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] d-card-pad shadow-[var(--shadow-1)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground truncate">
              ProjectId: {projectId}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('action-items', { projectId })}
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-[hsl(var(--surface-2))] px-3 py-2 text-sm font-semibold hover:bg-[hsl(var(--surface-hover))]"
              title="Open Action Items filtered to this job"
            >
              <ListChecks className="h-4 w-4" />
              Items
            </button>

            <button
              type="button"
              onClick={() => onNavigate('daily-logs', { projectId })}
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-[hsl(var(--surface-2))] px-3 py-2 text-sm font-semibold hover:bg-[hsl(var(--surface-hover))]"
              title="Open Daily Logs for this job"
            >
              <BookOpen className="h-4 w-4" />
              Logs
            </button>

            <button
              type="button"
              onClick={() => onNavigate('calendar', { projectId })}
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-[hsl(var(--surface-2))] px-3 py-2 text-sm font-semibold hover:bg-[hsl(var(--surface-hover))]"
              title="Open Calendar (job context)"
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-[hsl(var(--surface-1))] d-card-pad shadow-[var(--shadow-1)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Job Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="lld-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Job Number</label>
            <input value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} className="lld-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Site Name</label>
            <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="lld-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="lld-input w-full px-3 py-2 rounded-lg text-sm" />
          </div><div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Client</label>
            <input value={client} onChange={(e) => setClient(e.target.value)} className="lld-input w-full px-3 py-2 rounded-lg text-sm" />
          </div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="lld-input w-full px-3 py-2 rounded-lg text-sm">
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--destructive)/0.55)] bg-[hsl(var(--destructive)/0.10)] px-3 py-2 text-sm font-semibold text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.16)] disabled:opacity-50"
            title="Delete this job"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'DeletingÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦' : 'Delete Job'}
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-[hsl(var(--surface-2))] px-3 py-2 text-sm font-semibold hover:bg-[hsl(var(--surface-hover))] disabled:opacity-50"
            title="Save job changes"
          >
            <Save className="h-4 w-4" />
            {saving ? 'SavingÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦' : 'Save'}
          </button>
        </div>

        <div className="mt-2 text-[11px] text-muted-foreground">
          Note: Save will fully work after we extend updateProject() to patch job_number/site_name/location (next step).
        </div>
      </div>
    </div>
  );
}
