import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// derive project ref from URL
const projectRef = supabaseUrl?.split('//')[1]?.split('.')[0] ?? 'unknown';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: `lldv2-${projectRef}-auth`,
  },
});
