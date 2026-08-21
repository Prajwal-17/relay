export const DEVELOPMENT_API_PORT = 4723;
export const PRODUCTION_API_PORT = 4722;
export const STANDALONE_DEVELOPMENT_API_TOKEN = "quickcart-standalone-development";

export function defaultApiPort(mode: string | undefined): number {
  return mode === "development" ? DEVELOPMENT_API_PORT : PRODUCTION_API_PORT;
}

export function resolveApiPort(value: string | undefined, mode?: string): number {
  if (value === undefined || value.trim() === "") return defaultApiPort(mode);
  if (!/^\d+$/.test(value)) {
    throw new Error("M_VITE_API_PORT must be an integer between 1 and 65535.");
  }

  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error("M_VITE_API_PORT must be an integer between 1 and 65535.");
  }
  return port;
}
