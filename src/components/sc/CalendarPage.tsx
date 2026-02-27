import React, { useEffect, useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Check, Trash2,
  Calendar as CalIcon, StickyNote, Bell, Users2, Target, Search, Truck
} from 'lucide-react';
import { format, addMonths, subMonths, isSameDay, parseISO } from 'date-fns';
import type { CalendarNote, DailyLog, Project } from '@/lib/sitecommand-types';
import ActionItemDetailModal from './ActionItemDetailModal';
import { NOTE_TYPES } from '@/lib/sitecommand-types';
import ActionItemDetailModal from './ActionItemDetailModal';
import { getCalendarGrid, getPriorityDot, formatDate, todayStr, calculatePriority } from '@/lib/sitecommand-utils';
import PriorityBadge from './PriorityBadge';
import * as store from '@/lib/sitecommand-store';
import { supabase } from '@/lib/supabase';

interface CalendarPageProps {
  onNavigate: (page: string, data?: any) => void;
  initialData?: any;
}

const inputCls = 'lld-input w-full px-3 py-2 rounded-lg text-sm';
const labelCls = 'block text-xs font-medium text-muted-foreground mb-1';

const CalendarPage: React.FC<CalendarPageProps> = ({ onNavigate, initialData }) => {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const openDetail = (item: any) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedItem(null);
  };

async function openDetailById(id: string) {
  try {
    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return;

    openDetail(data as any);
  } catch (e) {
    console.error('Failed to load action item', e);
  }
}
const [logs, setLogs] = useState<DailyLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addErr, setAddErr] = useState<string | null>(null);
  // Note form
  const [noteForm, setNoteForm] = useState({
    title: '', description: '', note_type: 'note', priority: 'low', project_id: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [n, l, p] = await Promise.all([
        store.fetchCalendarNotes(month.getMonth(), month.getFullYear()),
        store.fetchDailyLogs(),
        store.fetchProjects(),
      ]);
      setNotes(n);
      setLogs(l);
      setProjects(p);
        } catch (e: any) {
      console.error(e);
      setAddErr(e?.message || "Failed to add note");
    }    setLoading(false);
  };

  useEffect(() => { loadData(); }, [month]);

  // Sync month with selectedDate (so notes created on another month appear immediately)
  useEffect(() => {
    try {
      const d = parseISO(selectedDate);
      if (d.getFullYear() !== month.getFullYear() || d.getMonth() !== month.getMonth()) {
        setMonth(d);
      }
    } catch {}
  }, [selectedDate]);
  const grid = getCalendarGrid(month.getFullYear(), month.getMonth());

  // Get items for a specific date
  const getDateItems = (dateStr: string) => {
    const dateLogs = logs.filter(l => l.log_date === dateStr);
    const dateNotes = notes.filter(n => n.note_date === dateStr);
    return { logs: dateLogs, notes: dateNotes };
  };

  const selectedItems = getDateItems(selectedDate);

  const handleAddNote = async () => {
    try {
      setAddErr(null);
      await store.createCalendarNote({
        ...noteForm,
        note_date: selectedDate,
        project_id: noteForm.project_id || null,
        is_completed: false,
      } as any);
      setNoteForm({ title: '', description: '', note_type: 'note', priority: 'low', project_id: '' });
      setShowAddNote(false);
      loadData();
        } catch (e: any) {
      console.error(e);
      setAddErr(e?.message || "Failed to add note");
    }  };

  const handleToggleNote = async (id: string, completed: boolean) => {
    await store.updateCalendarNote(id, { is_completed: completed });
    loadData();
  };

  const handleDeleteNote = async (id: string) => {
    await store.deleteCalendarNote(id);
    loadData();
  };

  const noteTypeIcon: Record<string, React.ElementType> = {
    note: StickyNote,
    reminder: Bell,
    meeting: Users2,
    deadline: Target,
    inspection: Search,
    delivery: Truck,
  };

  const noteTypeColor: Record<string, string> = {
    note: 'bg-blue-500',
    reminder: 'bg-purple-500',
    meeting: 'bg-indigo-500',
    deadline: 'bg-red-500',
    inspection: 'bg-primary',
    delivery: 'bg-green-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <button
          onClick={() => { setAddErr(null); setShowAddNote(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-foreground">{format(month, 'MMMM yyyy')}</h2>
            <button onClick={() => setMonth(addMonths(month, 1))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="aspect-square" />;
                const dateStr = format(day, 'yyyy-MM-dd');
                const isSelected = dateStr === selectedDate;
                const isToday = isSameDay(day, new Date());
                const items = getDateItems(dateStr);
                const hasLogs = items.logs.length > 0;
                const hasNotes = items.notes.length > 0;

                return (
                  <button
                    key={di}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square p-1 rounded-lg flex flex-col items-start transition-colors relative ${
                      isSelected ? 'bg-primary/20 border-2 border-primary/50'
                      : isToday ? 'bg-muted/70 border border-border'
                      : 'hover:bg-muted/30 border border-transparent'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isSelected ? 'text-primary' : isToday ? 'text-foreground' : 'text-foreground'}`}>
                      {day.getDate()}
                    </span>
                    <div className="flex gap-0.5 mt-auto flex-wrap">
                      {hasLogs && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      {items.notes.slice(0, 3).map((n, ni) => (
                        <span key={ni} className={`w-1.5 h-1.5 rounded-full ${noteTypeColor[n.note_type] || 'bg-blue-500'}`} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary" /> Jobs
            </div>
            {NOTE_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${t.color}`} /> {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Date Panel */}
        <div className="bg-card border border-border rounded-xl p-4 overflow-y-auto max-h-[700px]">
          <h3 className="text-sm font-bold text-foreground mb-3">
            {format(parseISO(selectedDate), 'EEEE, dd MMMM yyyy')}
          </h3>

          {/* Jobs for this date */}
          {selectedItems.logs.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-foreground/80 uppercase mb-2">Jobs</h4>
              <div className="space-y-2">
                {selectedItems.logs.map(log => (
                  <button
                    key={log.id}
                    onClick={() => onNavigate('daily-logs', { logId: log.id })}
                    className="w-full text-left p-3 rounded-lg bg-primary/10 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary">#{log.project?.job_number || 'â€”'}</span>
                      <PriorityBadge priority={log.priority} size="sm" showIcon={false} />
                    </div>
                    <p className="text-sm font-medium text-foreground mt-1">{log.project?.name || 'Unknown'}</p>
                    {log.weather && <p className="text-xs text-muted-foreground mt-1">{log.weather} {log.temperature}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes for this date */}
          {selectedItems.notes.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-foreground/80 uppercase mb-2">Notes & Reminders</h4>
              <div className="space-y-2">
                {selectedItems.notes.map(note => {
                  const NoteIcon = noteTypeIcon[note.note_type] || StickyNote;
                  return (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        note.is_completed ? 'bg-card/30 border-border opacity-60' : 'bg-muted/60 border-border'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={note.is_completed}
                          onChange={e => handleToggleNote(note.id, e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-border bg-muted text-amber-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <NoteIcon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className={`text-sm font-medium ${note.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {note.title}
                            </span>
                          </div>
                          {note.description && (
                            <p className="text-xs text-muted-foreground mt-1">{note.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <PriorityBadge priority={note.priority} size="sm" showIcon={false} />
                            <span className="text-[10px] text-muted-foreground capitalize">{note.note_type}</span>
                          </div>
                        </div>
                        {note.action_item_id && (
                          <button
                            onClick={() => openDetailById(note.action_item_id!)}
                            className="px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 text-xs font-semibold"
                          >
                            Open Action
                          </button>
                        )}
                        <button onClick={() => handleDeleteNote(note.id)} className="p-1 rounded hover:bg-red-500/20 text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedItems.logs.length === 0 && selectedItems.notes.length === 0 && (
            <div className="text-center py-8">
              <CalIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nothing scheduled</p>
              <button onClick={() => { setAddErr(null); setShowAddNote(true); }} className="mt-2 text-xs text-primary hover:text-primary/90">
                Add a note or reminder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Dialog */}
      {showAddNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setAddErr(null); setShowAddNote(false); }}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Add Note</h2>
              <button onClick={() => { setAddErr(null); setShowAddNote(false); }} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {addErr && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  {addErr}
                </div>
              )}
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Title *</label>
                <input value={noteForm.title} onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} className={inputCls} placeholder="e.g. Order plasterboard" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={noteForm.description} onChange={e => setNoteForm({ ...noteForm, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <select value={noteForm.note_type} onChange={e => setNoteForm({ ...noteForm, note_type: e.target.value })} className={inputCls}>
                    {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={noteForm.priority} onChange={e => setNoteForm({ ...noteForm, priority: e.target.value })} className={inputCls}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Link to Project (optional)</label>
                <select value={noteForm.project_id} onChange={e => setNoteForm({ ...noteForm, project_id: e.target.value })} className={inputCls}>
                  <option value="">None (General)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setAddErr(null); setShowAddNote(false); }} className="flex-1 py-2.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 text-sm font-medium">Cancel</button>
                <button onClick={handleAddNote} disabled={!noteForm.title.trim()} className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold disabled:opacity-50">Add Note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
);  };

export default CalendarPage;
















