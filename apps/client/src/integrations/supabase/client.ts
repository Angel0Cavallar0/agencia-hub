import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use placeholder values if env vars are not set (for development/preview)
const url = SUPABASE_URL || "https://placeholder.supabase.co";
const key = SUPABASE_PUBLISHABLE_KEY || "placeholder-key";

export const supabase = createClient(url, key, {
  auth: {
    storageKey: "agencia-hub-client-auth",
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
