import { createAppQueryClient } from "@/lib/queryClient";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

export const renderWithProviders = (
  ui: ReactElement,
  { route = "/", ...options }: RenderOptions & { route?: string } = {}
): RenderResult & { queryClient: QueryClient } => {
  const queryClient = createAppQueryClient();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>,
      options
    )
  };
};
