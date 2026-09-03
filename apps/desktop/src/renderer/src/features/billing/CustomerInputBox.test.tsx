// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TRANSACTION_TYPE, type Customer } from "@shared/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerNameInput } from "./CustomerInputBox";
import { useBillingSessionStore } from "./store/billingSession.store";
import { useBillingTabsStore } from "./store/billingTabs.store";

const tabId = "customer-highlight-tab";
const fixtures = vi.hoisted(() => ({
  customers: [
    {
      id: "customer-1",
      name: "Alice Stores",
      contact: "9876543210",
      customerType: "cash",
      notes: null,
      address: null,
      outstandingBalance: 0,
      isArchived: false,
      archivedAt: null
    }
  ] as Customer[]
}));

vi.mock("@/features/customers/hooks/useCustomersInfinite", async () => {
  const { useState } = await import("react");
  return {
    useCustomersInfinite: () => {
      const [search, setSearch] = useState("");
      return {
        customersData: fixtures.customers,
        status: "success",
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: vi.fn(),
        search,
        setSearch,
        isError: false,
        refetch: vi.fn(),
        isFetchNextPageError: false
      };
    }
  };
});

vi.mock("@/features/preferences/useAppPreferences", () => ({
  useAppPreferences: () => ({ config: { billing: { defaultCustomerId: null } } })
}));

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  useBillingSessionStore.setState({ sessions: {} });
  useBillingTabsStore.setState({
    tabs: [
      {
        id: tabId,
        type: TRANSACTION_TYPE.SALE,
        transactionNo: null,
        routePath: "/billing/sales/new"
      }
    ],
    activeTabId: tabId
  });
  useBillingSessionStore.getState().initSession(tabId);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("billing customer search", () => {
  it("highlights matches in customer names and contacts", async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <CustomerNameInput />
      </QueryClientProvider>
    );

    await user.click(screen.getByRole("combobox", { name: "Select customer" }));
    const input = screen.getByPlaceholderText("Search customer...");

    await user.type(input, "Ali");
    expect(screen.getByText("Ali", { selector: "mark" })).toHaveClass("bg-search-highlight");

    await user.clear(input);
    await user.type(input, "987");
    expect(screen.getByText("987", { selector: "mark" })).toHaveClass("bg-search-highlight");
  });
});
