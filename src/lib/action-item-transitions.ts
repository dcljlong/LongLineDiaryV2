import { supabase } from "@/lib/supabase";

export type ActionItemStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

export async function transitionActionItem(
  id: string,
  targetStatus: ActionItemStatus
) {
  const now = new Date().toISOString();

  const updates: Record<string, any> = {
    status: targetStatus,
    updated_at: now,
  };

  if (targetStatus === "done") {
    updates.completed_at = now;
  }

  if (targetStatus === "cancelled") {
    updates.cancelled_at = now;
  }

  const { error } = await supabase
    .from("action_items")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

// RLS-safe: caller can only update rows they own (policies enforce)
export async function setActionItemDeferUntil(
  id: string,
  deferUntil: string | null // YYYY-MM-DD or null
) {
  const now = new Date().toISOString();

  const updates: Record<string, any> = {
    defer_until: deferUntil,
    updated_at: now,
  };

  const { error } = await supabase
    .from("action_items")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}
