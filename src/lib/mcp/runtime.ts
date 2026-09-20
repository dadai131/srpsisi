type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

export function backendUrl(): string {
  const value = runtimeEnv("SUPABASE_URL") ?? runtimeEnv("VITE_SUPABASE_URL");
  if (!value) throw new Error("Backend URL is not configured");
  return value.replace(/\/+$/, "");
}

export const PUBLIC_SITE_URL = "https://lokifilms.qzz.io";