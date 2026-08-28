import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./apiClient";

export const shouldRetryQuery = (failureCount: number, error: unknown) => {
  if (failureCount >= 2 || !(error instanceof ApiError)) return false;
  if (error.kind === "network") return true;
  return (
    error.kind === "http" && (error.status === 408 || error.status === 429 || error.status >= 500)
  );
};

export const queryRetryDelay = (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 4_000);

export const createAppQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        retryDelay: queryRetryDelay
      },
      mutations: { retry: false }
    }
  });

export const queryClient = createAppQueryClient();
