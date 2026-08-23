// Single place for all network traffic.
//
//   REST       -> /api/*   (proxied to the Express backend, see vite.config.ts)
//   WebSocket  -> /ws/*    (proxied to the same backend)
//
// Keeping every request behind these two prefixes keeps browser calls
// same-origin and lets the backend's CORS middleware cover cross-origin access.

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { error?: string };
      if (typeof data?.error === "string") message = data.error;
    } catch {
      // Non-JSON error body; keep the status text.
    }
    throw new Error(message || `Request failed (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  remove: <T = void>(path: string) =>
    apiRequest<T>(path, { method: "DELETE" }),
};

/** WebSocket URL for the current origin (ws:// or wss://), under /ws/*. */
export function wsUrl(path = ""): string {
  const { protocol, host } = window.location;
  const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${host}/ws${path}`;
}
