/** Money changes only on cache misses, user refreshes, and this client's successful writes. */
export const moneyQueryPolicy = {
  staleTime: Infinity,
  gcTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
  retry: false,
  retryOnMount: false
} as const;
