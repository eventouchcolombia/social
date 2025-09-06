
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uofmfzpfxdghwgrbgzun.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZm1menBmeGRnaHdncmJnenVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMDAzMTUsImV4cCI6MjA3MjY3NjMxNX0.yHF5ouV0HnVlfyh4U9uorJDSQ3m8BijHzo0zuYUfOYc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
