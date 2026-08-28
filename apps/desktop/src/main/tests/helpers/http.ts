import type { Hono } from "hono";

type RequestApp = Pick<Hono<any>, "request">;

export async function requestJson(
  app: RequestApp,
  method: "POST" | "PATCH" | "DELETE",
  pathname: string,
  payload?: unknown
) {
  return app.request(pathname, {
    method,
    headers: payload === undefined ? undefined : { "content-type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
}

export async function getJson(app: RequestApp, pathname: string) {
  return app.request(pathname, { method: "GET" });
}

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function postTxn(app: RequestApp, pathname: string, payload: unknown) {
  return requestJson(app, "POST", pathname, { data: payload });
}
