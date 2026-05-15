import { createClient } from "@supabase/supabase-js";
import { getRuntimeConfig } from "@/lib/config/runtime";

export function createSupabaseServiceClient() {
  const config = getRuntimeConfig();

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error("Supabase service credentials are not configured.");
  }

  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
