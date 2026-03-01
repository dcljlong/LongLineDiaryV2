import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AnyItem = any;

const HOURS_START = 6;
const HOURS_END = 18;

const dateStr = (d: Date) => d.toISOString().slice(0, 10);

function toTimeInput(v: any): string {
  if (!v) return "";
  const s = String(v);
  if (s.length >= 5) return s.slice(0, 5);
  return s;
}

function normalizeTimeOrNull(v: string): string | null {
  const t = (v || "").trim();
  if (!t) return null;
  // accept HH:MM
  return t.length === 5 ? t : t;
}

const CalendarPage: React.FC = () => {
  const today = new Date();
  const [mode, setMode] = useState<"month" | "day">("month");
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [items, setItems] = useState<AnyItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AnyItem | null>(null);
  const [loading, setLoading] = useState(true);

  // edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  const [tTitle, setTTitle] = useState("");
  const [tDetails, setTDetails] = useState("");
  const [tDue, setTDue] = useState("");
  const [tStart, setTStart] = useState("");
  const [tEnd, setTEnd] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("action_items")
      .select("*")
      .is("deleted_at", null);

    if (!error && data) setItems(data as AnyItem[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const monthLabel = current.toLocaleString("default", { month: "long", year: "numeric" });

  const changeMonth = (offset: number) => {
    setCurrent(new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const dayItems = useMemo(() => {
    const key = dateStr(selectedDay);
    return items.filter(i => i.due_date === key);
  }, [items, selectedDay]);

  const agendaItems = useMemo(() => {
    return dayItems.filter(i => !i.start_time && !i.end_time);
  }, [dayItems]);

  const timedItems = useMemo(() => {
    return dayItems.filter(i => !!i.start_time || !!i.end_time);
  }, [dayItems]);

  const openEdit = (it: AnyItem) => {
    setSelectedItem(it);
    setEditErr(null);
    setTTitle(String(it.title || ""));
    setTDetails(String(it.details || ""));
    setTDue(String(it.due_date || dateStr(selectedDay)));
    setTStart(toTimeInput(it.start_time));
    setTEnd(toTimeInput(it.end_time));
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (editBusy) return;
    setEditOpen(false);
    setSelectedItem(null);
    setEditErr(null);
  };

  const saveEdit = async () => {
    if (!selectedItem?.id) return;
    setEditBusy(true);
    setEditErr(null);

    try {
      const payload: any = {
        title: (tTitle || "").trim() || null,
        details: (tDetails || "").trim() || null,
        due_date: (tDue || "").trim() || null,
        start_time: normalizeTimeOrNull(tStart),
        end_time: normalizeTimeOrNull(tEnd),
      };

      const { error } = await supabase
        .from("action_items")
        .update(payload)
        .eq("id", selectedItem.id);

      if (error) throw error;

      await load();
      setEditOpen(false);
      setSelectedItem(null);
    } catch (e: any) {
      setEditErr(e?.message || "Save failed");
    } finally {
      setEditBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">

      <div className="flex gap-2">
        <button
          onClick={() => setMode("month")}
          className={"px-3 py-1 border rounded " + (mode==="month" ? "bg-primary text-primary-foreground" : "")}
        >
          Month
        </button>
        <button
          onClick={() => setMode("day")}
          className={"px-3 py-1 border rounded " + (mode==="day" ? "bg-primary text-primary-foreground" : "")}
        >
          Day
        </button>
      </div>

      {mode === "month" && (
        <>
          <div className="flex justify-between items-center">
            <button onClick={() => changeMonth(-1)} className="px-3 py-1 border rounded">?</button>
            <div className="text-lg font-semibold">{monthLabel}</div>
            <button onClick={() => changeMonth(1)} className="px-3 py-1 border rounded">?</button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-sm text-center text-muted-foreground">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 42 }).map((_, i) => {
              const first = new Date(current.getFullYear(), current.getMonth(), 1);
              const startDay = first.getDay();
              const dayNum = i - startDay + 1;
              const daysInMonth = new Date(current.getFullYear(), current.getMonth()+1, 0).getDate();
              if (dayNum < 1 || dayNum > daysInMonth) {
                return <div key={i} className="h-24 border rounded bg-muted/20" />;
              }

              const date = new Date(current.getFullYear(), current.getMonth(), dayNum);
              const key = dateStr(date);
              const count = items.filter(it => it.due_date === key).length;

              return (
                <div
                  key={i}
                  onClick={() => { setSelectedDay(date); setMode("day"); }}
                  className="h-24 border rounded p-1 cursor-pointer hover:bg-muted/40"
                >
                  <div className="text-xs">{dayNum}</div>
                  {count > 0 && (
                    <div className="mt-1 text-xs bg-primary/20 px-1 rounded">
                      {count} item{count>1?"s":""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {mode === "day" && (
        <>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setSelectedDay(new Date(selectedDay.getTime() - 86400000))}
              className="px-3 py-1 border rounded"
            >
              ?
            </button>

            <div className="font-semibold">
              {selectedDay.toDateString()}
            </div>

            <button
              onClick={() => setSelectedDay(new Date(selectedDay.getTime() + 86400000))}
              className="px-3 py-1 border rounded"
            >
              ?
            </button>
          </div>

          {agendaItems.length > 0 && (
            <div className="border rounded p-3 space-y-2">
              <div className="text-sm font-semibold">Agenda (no time)</div>
              {agendaItems.map((a: AnyItem) => (
                <button
                  key={a.id}
                  onClick={() => openEdit(a)}
                  className="w-full text-left px-3 py-2 rounded border hover:bg-muted/40"
                >
                  {a.title || "Untitled"}
                </button>
              ))}
            </div>
          )}

          <div className="relative border rounded h-[600px] overflow-hidden">
            {Array.from({ length: HOURS_END - HOURS_START + 1 }).map((_, i) => {
              const hour = HOURS_START + i;
              return (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t text-xs text-muted-foreground"
                  style={{ top: (i / (HOURS_END - HOURS_START)) * 100 + "%" }}
                >
                  <span className="absolute -left-12">{hour}:00</span>
                </div>
              );
            })}

            {timedItems.map((n: AnyItem, idx: number) => {
              const sh = n.start_time ? parseInt(String(n.start_time).split(":")[0]) : 8;
              const eh = n.end_time ? parseInt(String(n.end_time).split(":")[0]) : (sh + 2);

              const top = ((sh - HOURS_START) / (HOURS_END - HOURS_START)) * 100;
              const height = ((eh - sh) / (HOURS_END - HOURS_START)) * 100;

              const lane = idx % 3;
              const leftPx = 64 + (lane * 10);
              const rightPx = 16 + ((2 - lane) * 10);

              return (
                <div
                  key={n.id}
                  onClick={() => openEdit(n)}
                  className="absolute rounded p-2 text-xs bg-primary/20 border border-primary cursor-pointer hover:bg-primary/30 overflow-hidden"
                  style={{
                    top: top + "%",
                    height: Math.max(height, 6) + "%",
                    left: leftPx + "px",
                    right: rightPx + "px",
                    zIndex: 10 + lane
                  }}
                >
                  <div className="font-medium leading-4 truncate">{n.title || "Untitled"}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={closeEdit}
          />
          <div className="absolute inset-x-0 top-10 mx-auto w-[95%] max-w-xl">
            <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="text-base font-semibold">Edit Item</div>
                {editErr && <div className="mt-2 text-sm text-danger">{editErr}</div>}
              </div>

              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Title</label>
                  <input
                    className="w-full px-3 py-2 border rounded bg-background"
                    value={tTitle}
                    onChange={(e) => setTTitle(e.target.value)}
                    placeholder="Title"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Details</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded bg-background min-h-[90px]"
                    value={tDetails}
                    onChange={(e) => setTDetails(e.target.value)}
                    placeholder="Details"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Due date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded bg-background"
                      value={tDue}
                      onChange={(e) => setTDue(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Start</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded bg-background"
                      value={tStart}
                      onChange={(e) => setTStart(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">End</label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded bg-background"
                      value={tEnd}
                      onChange={(e) => setTEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-2">
                <button
                  className="px-3 py-2 border rounded"
                  onClick={closeEdit}
                  disabled={editBusy}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 rounded bg-primary text-primary-foreground"
                  onClick={saveEdit}
                  disabled={editBusy}
                >
                  {editBusy ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CalendarPage;
