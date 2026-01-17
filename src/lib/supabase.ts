import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wsbzhfeaxgpfppyacflj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzYnpoZmVheGdwZnBweWFjZmxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5OTE3NjAsImV4cCI6MjA4MzU2Nzc2MH0.I-zljAsMfPvwMJxEaipPh5OlXZ3sFLtWT7uYOzp6c5Y";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

