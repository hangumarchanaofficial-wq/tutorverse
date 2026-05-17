import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { env } from "../config/env.js";

/** Node.js 20 has no built-in WebSocket; realtime-js needs explicit transport. */
const realtimeOptions = { transport: ws };

export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: realtimeOptions,
});

export const supabaseAnon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: realtimeOptions,
});
