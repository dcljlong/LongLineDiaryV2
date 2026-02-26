import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env for this shell.");
  process.exit(1);
}

const sb = createClient(url, service, { auth: { persistSession: false } });

async function cols(table) {
  const { data, error } = await sb
    .from("information_schema.columns")
    .select("column_name,data_type,is_nullable")
    .eq("table_schema", "public")
    .eq("table_name", table)
    .order("ordinal_position", { ascending: true });

  if (error) throw error;
  return data;
}

(async () => {
  const tables = ["work_activities","materials","equipment_logs","crew_attendance","visitors","calendar_notes","action_items"];
  for (const t of tables) {
    try {
      const data = await cols(t);
      console.log("\n==", t, "==");
      for (const r of data) console.log(`${r.column_name}\t${r.data_type}\t${r.is_nullable}`);
    } catch (e) {
      console.log("\n==", t, "==");
      console.log("ERROR:", e.message || e);
    }
  }
})();
