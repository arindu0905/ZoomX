/** Browser → storefront API helper with uniform, user-safe error messages. */
export async function sendJson<T = unknown>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; message: string; status: number }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
    const json = (await res.json().catch(() => null)) as (T & { error?: { message?: string } }) | null;
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: json?.error?.message ?? "Something went wrong. Please try again.",
      };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0, message: "You appear to be offline. Please check your connection." };
  }
}
