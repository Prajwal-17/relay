import { createMiddleware } from "hono/factory";
import type { AppConfig } from "../../shared/types";

let settingsCache: AppConfig | null = null;

export const invalidateSettingsCache = () => {
  settingsCache = null;
};

export const settingsMiddleware = createMiddleware(async (c, next) => {
  if (!settingsCache) {
    // const value = db
  }

  c.set("settings", settingsCache);

  await next();
});
