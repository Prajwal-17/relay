import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";

function trustedOrigins(env: Env): string[] {
  const configured = env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set(["relay://", "relay://*", ...configured])];
}

export function createAuth(env: Env) {
  return betterAuth({
    appName: "Relay",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    trustedOrigins: trustedOrigins(env),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: "select_account"
      }
    },
    plugins: [expo()],
    advanced: {
      database: {
        generateId: "uuid"
      }
    }
  });
}

export type RelayAuth = ReturnType<typeof createAuth>;
