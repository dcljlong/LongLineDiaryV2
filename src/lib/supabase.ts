import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qbqceybdmesgqsvvhfzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicWNleWJkbWVzZ3FzdnZoZnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4Nzc2NzQsImV4cCI6MjA4NzQ1MzY3NH0.UgDmKnVvvX3WcESuXp8EVkuZDIIQ7KblubQX-hcpR3c';
export const supabase = createClient(supabaseUrl, supabaseKey);
