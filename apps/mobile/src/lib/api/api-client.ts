import { Platform } from "react-native";

import { authClient, serverUrl } from "@/lib/auth/auth-client";

type ErrorPayload = {
  error?: {
    message?: string;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (Platform.OS !== "web") {
    const cookie = await authClient.getCookie();
    if (cookie) headers.set("Cookie", cookie);
  }

  const response = await fetch(`${serverUrl}${path}`, {
    ...init,
    headers,
    credentials: "include"
  });

  if (!response.ok) {
    let message = "The request could not be completed.";
    try {
      const payload = (await response.json()) as ErrorPayload;
      message = payload.error?.message || message;
    } catch {
      // The status remains actionable when an intermediary returns a non-JSON body.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
