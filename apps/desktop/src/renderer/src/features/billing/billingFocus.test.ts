// @vitest-environment jsdom

import { useSearchDropdownStore } from "@/features/billing/product-search/searchDropdown.store";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { focusFirstEmptyLineItem } from "./billingFocus";

const tabId = "billing-focus-test";

describe("billing focus helpers", () => {
  beforeEach(() => {
    useBillingSessionStore.setState({ sessions: {} });
    useBillingSessionStore.getState().initSession(tabId);
    useSearchDropdownStore.getState().reset();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("focuses the first empty line item in table order", () => {
    const lineItems = useBillingSessionStore.getState().sessions[tabId]!.lineItems;
    const firstRow = lineItems[0]!;
    const lastRow = lineItems.at(-1)!;
    document.body.innerHTML = [firstRow.rowId, lastRow.rowId]
      .map((rowId) => `<input data-billing-product-input="${rowId}" />`)
      .join("");

    focusFirstEmptyLineItem(tabId);

    expect(useSearchDropdownStore.getState()).toMatchObject({
      activeRowId: firstRow.rowId,
      itemQuery: "",
      isDropdownOpen: false
    });
    expect(document.activeElement).toBe(
      document.querySelector(`[data-billing-product-input="${firstRow.rowId}"]`)
    );
  });
});
