import "server-only";

export interface ServerEnvironment {
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
}

export class ServerEnvironmentError extends Error {
  constructor() {
    super("La configuración segura del servidor está incompleta.");
    this.name = "ServerEnvironmentError";
  }
}

export function loadServerEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): ServerEnvironment {
  const supabaseUrl = environment.SUPABASE_URL?.trim();
  const supabaseServiceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new ServerEnvironmentError();
  }

  return { supabaseUrl, supabaseServiceRoleKey };
}
