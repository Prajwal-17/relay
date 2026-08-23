// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BILLSTATUS } from "@shared/types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useBillingSessionStore } from "./store/billingSession.store";
import { useBillingTabsStore } from "./store/billingTabs.store";
import { BillingSaveStatus } from "./BillingSaveStatus";

const tabId = "save-status-tab";

beforeEach(() => {
  useBillingSessionStore.setState({ sessions: {} });
  useBillingTabsStore.setState({
    tabs: [
      {
        id: tabId,
        type: "sale",
        transactionNo: null,
        routePath: "/billing/sales/create"
      }
    ],
    activeTabId: tabId
  });
  useBillingSessionStore.getState().initSession(tabId);
});

afterEach(cleanup);

describe("BillingSaveStatus", () => {
  it.each([
    [BILLSTATUS.IDLE, "Saved"],
    [BILLSTATUS.SAVING, "Saving..."],
    [BILLSTATUS.SAVED, "Saved"],
    [BILLSTATUS.UNSAVED, "Unsaved Changes"],
    [BILLSTATUS.ERROR, "Save Failed"]
  ])("renders %s as %s", (status, label) => {
    useBillingSessionStore.getState().updateUiField(tabId, "status", status);
    render(<BillingSaveStatus />);
    expect(screen.getByText(label, { exact: true })).toBeVisible();
  });
});
