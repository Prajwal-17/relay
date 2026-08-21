export const API_BASE_URL = "http://localhost:4723";

export type ApiLogEntry = {
  source: "fixture" | "renderer";
  method: string;
  url: string;
  status: number | "failed";
  durationMs: number;
  failure?: string;
};

export type ApiRequestOptions = {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  signal?: AbortSignal;
};

export class PublicApi {
  constructor(
    readonly baseUrl = API_BASE_URL,
    private readonly log: ApiLogEntry[] = []
  ) {}

  async request<T>(method: string, pathname: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = new URL(pathname, this.baseUrl);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
    }

    const startedAt = Date.now();
    let responseLogged = false;
    try {
      const response = await fetch(url, {
        method,
        headers: options.body === undefined ? undefined : { "content-type": "application/json" },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal
      });
      responseLogged = true;
      this.log.push({
        source: "fixture",
        method,
        url: url.toString(),
        status: response.status,
        durationMs: Date.now() - startedAt
      });

      const text = await response.text();
      const parsed = text ? (JSON.parse(text) as unknown) : undefined;
      if (!response.ok) {
        const message =
          typeof parsed === "object" && parsed && "error" in parsed
            ? JSON.stringify(parsed)
            : `${response.status} ${response.statusText}`;
        throw new Error(`${method} ${pathname} failed: ${message}`);
      }
      return parsed as T;
    } catch (error) {
      if (!responseLogged) {
        this.log.push({
          source: "fixture",
          method,
          url: url.toString(),
          status: "failed",
          durationMs: Date.now() - startedAt,
          failure: error instanceof Error ? error.message : String(error)
        });
      }
      throw error;
    }
  }

  get<T>(pathname: string, query?: ApiRequestOptions["query"]): Promise<T> {
    return this.request<T>("GET", pathname, { query });
  }

  post<T>(pathname: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", pathname, { body });
  }

  patch<T>(pathname: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", pathname, { body });
  }

  delete<T>(pathname: string): Promise<T> {
    return this.request<T>("DELETE", pathname);
  }
}
