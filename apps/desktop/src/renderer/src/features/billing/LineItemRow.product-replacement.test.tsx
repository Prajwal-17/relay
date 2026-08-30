// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BillingProductDTO } from "@shared/types";
import { TRANSACTION_TYPE } from "@shared/types";
import { buildTransactionPayload, normalizeLineItems } from "@/utils/renderer.utils";
import { useSearchDropdownStore } from "./product-search/searchDropdown.store";
import { useBillingSessionStore } from "./store/billingSession.store";
import type { LineItem } from "./store/billingSession.types";
import { useBillingTabsStore } from "./store/billingTabs.store";
import LineItemRow from "./LineItemRow";

const scheduleMock = vi.hoisted(() => vi.fn());

vi.mock("./syncWorker", () => ({
  processSyncQueue: scheduleMock
}));

vi.mock("./product-search/MemoizedProductSearchDropdown", () => ({
  MemoizedProductSearchDropdown: () => null
}));

function product(name: string, price: number): BillingProductDTO {
  return {
    id: crypto.randomUUID(),
    name,
    productSnapshot: `${name} 1 pc`,
    weight: "1",
    unit: "pc",
    mrp: price + 500,
    price,
    purchasePrice: price - 1000
  };
}

function initializeCommittedTab(tabId: string, selected: BillingProductDTO): LineItem {
  useBillingTabsStore.setState((state) => ({
    tabs: [
      ...state.tabs,
      {
        id: tabId,
        type: TRANSACTION_TYPE.SALE,
        transactionNo: 1,
        routePath: `/billing/sales/${crypto.randomUUID()}/edit`
      }
    ],
    activeTabId: tabId
  }));
  const store = useBillingSessionStore.getState();
  store.initSession(tabId);
  store.hydrateSession(tabId, {
    billingId: crypto.randomUUID(),
    transactionNo: 1,
    customerId: crypto.randomUUID(),
    customerName: "Default Customer"
  });
  const rowId = useBillingSessionStore.getState().sessions[tabId]!.lineItems[0]!.rowId;
  store.addLineItem(tabId, rowId, selected);
  const committed = useBillingSessionStore
    .getState()
    .sessions[tabId]!.lineItems.find((item) => item.rowId === rowId)!;
  store.acknowledgeSync(tabId, {
    itemRevisions: new Map([[rowId, committed.revision]]),
    metadataRevision: useBillingSessionStore.getState().sessions[tabId]!.metadataRevision,
    itemIds: new Map([[rowId, crypto.randomUUID()]]),
    deletedRowIds: new Set()
  });
  return useBillingSessionStore
    .getState()
    .sessions[tabId]!.lineItems.find((item) => item.rowId === rowId)!;
}

function databasePayload(tabId: string, row: LineItem) {
  const session = useBillingSessionStore.getState().sessions[tabId]!;
  return buildTransactionPayload({
    billingType: session.billingType,
    transactionNo: session.transactionNo,
    customerId: session.customerId,
    items: normalizeLineItems([row]),
    notes: session.notes,
    addToAccounting: session.addToAccounting,
    createdAt: session.billingDate.toISOString()
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  scheduleMock.mockReset();
  useBillingSessionStore.setState({ sessions: {} });
  useBillingTabsStore.setState({ tabs: [], activeTabId: null });
  useSearchDropdownStore.getState().reset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("catalog product replacement and custom items", () => {
  it("turns an edited catalog product label into a custom transaction item", () => {
    const tabId = "replacement-draft";
    const committed = initializeCommittedTab(tabId, product("Committed Product", 12_345));
    useBillingSessionStore.getState().updateLineItem(tabId, committed.rowId, "quantity", "1.234");
    const rowBeforeTyping = {
      ...useBillingSessionStore
        .getState()
        .sessions[tabId]!.lineItems.find((item) => item.rowId === committed.rowId)!
    };

    const view = render(
      <LineItemRow idx={0} item={rowBeforeTyping} isCountColumnVisible={false} disableDrag />
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Product row 1" }), {
      target: { value: "Different Prod" }
    });

    const rowAfterTyping = useBillingSessionStore
      .getState()
      .sessions[tabId]!.lineItems.find((item) => item.rowId === committed.rowId)!;
    expect.soft(rowAfterTyping).toMatchObject({
      id: rowBeforeTyping.id,
      productId: null,
      name: "Different Prod",
      productSnapshot: "Different Prod",
      weight: null,
      unit: null,
      mrp: null,
      price: rowBeforeTyping.price,
      quantity: rowBeforeTyping.quantity,
      totalPrice: rowBeforeTyping.totalPrice,
      isInventoryItem: false,
      revision: rowBeforeTyping.revision + 1
    });
    expect.soft(databasePayload(tabId, rowAfterTyping).data.items[0]).toMatchObject({
      productId: null,
      name: "Different Prod",
      productSnapshot: "Different Prod"
    });
    expect.soft(scheduleMock).toHaveBeenCalledWith(tabId);
    expect.soft(useSearchDropdownStore.getState().itemQuery).toBe("Different Prod");

    act(() => useSearchDropdownStore.getState().setIsDropdownOpen(false));
    view.rerender(
      <LineItemRow idx={0} item={rowAfterTyping} isCountColumnVisible={false} disableDrag />
    );
    expect(screen.getByRole("textbox", { name: "Product row 1" })).toHaveValue("Different Prod");
  });

  it("commits every catalog field together and increments the row revision exactly once", () => {
    const tabId = "atomic-selection";
    const committed = initializeCommittedTab(tabId, product("Original Product", 6800));
    const replacement = product("Replacement Product", 15_234);
    const revisionBeforeSelection = committed.revision;

    useBillingSessionStore.getState().addLineItem(tabId, committed.rowId, replacement);

    expect(
      useBillingSessionStore
        .getState()
        .sessions[tabId]!.lineItems.find((item) => item.rowId === committed.rowId)
    ).toMatchObject({
      productId: replacement.id,
      name: replacement.name,
      productSnapshot: replacement.productSnapshot,
      weight: replacement.weight,
      unit: replacement.unit,
      mrp: replacement.mrp,
      price: "152.34",
      revision: revisionBeforeSelection + 1
    });
  });

  it("keeps each tab's replacement draft with that tab when switching tabs", () => {
    const first = initializeCommittedTab("draft-tab-a", product("Tab A Product", 6800));
    initializeCommittedTab("draft-tab-b", product("Tab B Product", 7200));
    useBillingTabsStore.getState().setActiveTab("draft-tab-a");
    useSearchDropdownStore.getState().setActiveRowId(first.rowId);
    useSearchDropdownStore.getState().setItemQuery("Tab A half typed");

    useBillingTabsStore.getState().setActiveTab("draft-tab-b");
    expect.soft(useSearchDropdownStore.getState().itemQuery).toBe("");

    useBillingTabsStore.getState().setActiveTab("draft-tab-a");
    expect.soft(useSearchDropdownStore.getState().itemQuery).toBe("Tab A half typed");
  });
});
