import "server-only";
import { createClient } from "@supabase/supabase-js";
import { loadServerEnvironment } from "@/infrastructure/config/server-env";
import { SupabaseResultRepository } from "@/infrastructure/persistence/supabase-result-repository";

export function createResultRepository() {
  const environment = loadServerEnvironment();
  const client = createClient(
    environment.supabaseUrl,
    environment.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  return new SupabaseResultRepository(client);
}
