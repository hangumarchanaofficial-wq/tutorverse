import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep booting for local UI preview, but auth/API will fail until envs are set.
  // eslint-disable-next-line no-console
  console.warn("Missing Supabase env vars: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY");
}

export const supabase = createClient(
  supabaseUrl || "https://example.supabase.co",
  supabaseAnonKey || "public-anon-key"
);
