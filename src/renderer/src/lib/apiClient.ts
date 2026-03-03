const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4722";

function buildURL(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.href.toString();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const url = buildURL(path, params);
  const response = await fetch(url, {
    headers: {
      "Content-type": "application/json",
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody.error.message || `Request failed (${response.status})`);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return {} as T;
  }

  const data = await response.json();
  return data as T;
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>(path, { method: "GET" }, params),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" })
};
