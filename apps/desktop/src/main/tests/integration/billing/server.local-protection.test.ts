import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  serve: vi.fn((_options: unknown) => ({ close: vi.fn() })),
  loggerError: vi.fn()
}));

vi.mock("@hono/node-server", () => ({ serve: mocks.serve }));
vi.mock("../../../db/db", () => ({
  db: null,
  initDb: mocks.initDb
}));
vi.mock("../../../middleware/logger", () => ({
  logger: async (_context: unknown, next: () => Promise<void>) => next(),
  loggerInstance: { error: mocks.loggerError }
}));

type ServerOptions = {
  fetch: (request: Request) => Response | Promise<Response>;
  port: number;
  hostname?: string;
};

const launchToken = "per-launch-test-token";
let serverOptions: ServerOptions;
let previousToken: string | undefined;
let previousPort: string | undefined;

beforeAll(async () => {
  previousToken = process.env.M_VITE_API_TOKEN;
  previousPort = process.env.M_VITE_API_PORT;
  process.env.M_VITE_API_TOKEN = launchToken;
  process.env.M_VITE_API_PORT = "49123";
  await import("../../../server");
  await vi.waitFor(() => expect(mocks.serve).toHaveBeenCalled());
  serverOptions = mocks.serve.mock.calls[0]![0] as unknown as ServerOptions;
});

afterAll(() => {
  if (previousToken === undefined) delete process.env.M_VITE_API_TOKEN;
  else process.env.M_VITE_API_TOKEN = previousToken;
  if (previousPort === undefined) delete process.env.M_VITE_API_PORT;
  else process.env.M_VITE_API_PORT = previousPort;
});

function request(
  pathname: string,
  options: {
    method?: string;
    token?: string;
    origin?: string;
    json?: unknown;
  } = {}
) {
  const headers = new Headers();
  if (options.token !== undefined) headers.set("x-quickcart-api-token", options.token);
  if (options.origin !== undefined) headers.set("origin", options.origin);
  if (options.json !== undefined) headers.set("content-type", "application/json");
  return serverOptions.fetch(
    new Request(`http://127.0.0.1:49123${pathname}`, {
      method: options.method ?? "GET",
      headers,
      body: options.json === undefined ? undefined : JSON.stringify(options.json)
    })
  );
}

describe("local API protection", () => {
  it("binds the server only to 127.0.0.1", () => {
    expect(serverOptions).toMatchObject({ port: 49123, hostname: "127.0.0.1" });
  });

  it.each([
    ["missing", undefined],
    ["incorrect", "not-the-launch-token"]
  ])("returns 401 for a %s API token before route matching", async (_label, token) => {
    const response = await request("/api/not-a-real-route", { token });

    expect(response.status).toBe(401);
  });

  it("allows the correct per-launch token through authentication", async () => {
    const response = await request("/api/not-a-real-route", { token: launchToken });

    expect(response.status).not.toBe(401);
  });

  it("does not grant CORS permission to an unapproved web origin", async () => {
    const response = await request("/api/not-a-real-route", {
      token: launchToken,
      origin: "https://unapproved.example"
    });

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it.each([
    ["sales create", "/api/sales/create", "POST"],
    ["estimates create", "/api/estimates/create", "POST"],
    ["sale delete", "/api/sales/not-a-uuid", "DELETE"],
    ["estimate sync", "/api/estimates/not-a-uuid/sync", "POST"]
  ])("authenticates before the %s handler", async (_label, pathname, method) => {
    const response = await request(pathname, { method, json: {} });

    expect(response.status).toBe(401);
  });
});
