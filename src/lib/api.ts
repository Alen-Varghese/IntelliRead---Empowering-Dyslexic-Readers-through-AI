// Calls the local IntelliRead API (server/index.ts) instead of Supabase Edge Functions.
export async function invokeFunction<T = any>(name: string, options: { body?: unknown } = {}): Promise<{ data: T | null; error: Error | null }> {
  try {
    const res = await fetch(`/api/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options.body ?? {}),
    });
    const data = await res.json();
    if (!res.ok) return { data: null, error: new Error(data?.error || `Request failed (${res.status})`) };
    return { data, error: null };
  } catch (e) {
    return { data: null, error: new Error("Cannot reach the IntelliRead API. Is the server running (npm run dev)?") };
  }
}
