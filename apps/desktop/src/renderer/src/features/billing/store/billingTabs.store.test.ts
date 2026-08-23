import { TRANSACTION_TYPE } from "@shared/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { billingSyncCoordinator } from "../syncWorker";
import { billingCoordinator } from "./billingCoordinator";
import { useBillingSessionStore } from "./billingSession.store";
import { MAX_BILLING_TABS, useBillingTabsStore } from "./billingTabs.store";

beforeEach(() => {
  vi.restoreAllMocks();
  useBillingTabsStore.setState({ tabs: [], activeTabId: null });
  useBillingSessionStore.setState({ sessions: {} });
});

describe("billing tab state", () => {
  it("creates independent sale and estimate sessions while grouping sales first", () => {
    const estimate = billingCoordinator.addTab(
      TRANSACTION_TYPE.ESTIMATE,
      "/billing/estimates/create"
    );
    const sale = billingCoordinator.addTab(TRANSACTION_TYPE.SALE, "/billing/sales/create");

    expect(estimate).not.toBeNull();
    expect(sale).not.toBeNull();
    expect(useBillingTabsStore.getState().tabs.map((tab) => tab.type)).toEqual([
      TRANSACTION_TYPE.SALE,
      TRANSACTION_TYPE.ESTIMATE
    ]);
    expect(useBillingSessionStore.getState().sessions[sale!.id]?.billingType).toBe(
      TRANSACTION_TYPE.SALE
    );
    expect(useBillingSessionStore.getState().sessions[estimate!.id]?.billingType).toBe(
      TRANSACTION_TYPE.ESTIMATE
    );
  });

  it("allows eight tabs and refuses the ninth without creating a session", () => {
    const created = Array.from({ length: MAX_BILLING_TABS }, (_, index) =>
      billingCoordinator.addTab(
        TRANSACTION_TYPE.SALE,
        `/billing/sales/${crypto.randomUUID()}/edit`,
        index + 1
      )
    );
    const rejected = billingCoordinator.addTab(
      TRANSACTION_TYPE.SALE,
      `/billing/sales/${crypto.randomUUID()}/edit`,
      9
    );

    expect(created.every(Boolean)).toBe(true);
    expect(rejected).toBeNull();
    expect(useBillingTabsStore.getState().tabs).toHaveLength(MAX_BILLING_TABS);
    expect(Object.keys(useBillingSessionStore.getState().sessions)).toHaveLength(MAX_BILLING_TABS);
  });

  it("reopening an existing saved route activates it without duplicating state", () => {
    const route = `/billing/sales/${crypto.randomUUID()}/edit`;
    const first = useBillingTabsStore.getState().addTab(TRANSACTION_TYPE.SALE, route, 42, true);
    const reopened = useBillingTabsStore.getState().addTab(TRANSACTION_TYPE.SALE, route, 42, true);

    expect(first).not.toBeNull();
    expect(reopened?.id).toBe(first?.id);
    expect(useBillingTabsStore.getState().tabs).toHaveLength(1);
    expect(useBillingTabsStore.getState().activeTabId).toBe(first?.id);
  });

  it("removing one tab removes only its billing session", () => {
    const first = billingCoordinator.addTab(TRANSACTION_TYPE.SALE, "/billing/sales/create");
    const second = billingCoordinator.addTab(
      TRANSACTION_TYPE.ESTIMATE,
      "/billing/estimates/create"
    );
    billingCoordinator.removeTab(first!.id);

    expect(useBillingTabsStore.getState().tabs.map((tab) => tab.id)).toEqual([second!.id]);
    expect(useBillingSessionStore.getState().sessions[first!.id]).toBeUndefined();
    expect(useBillingSessionStore.getState().sessions[second!.id]).toBeDefined();
  });

  it("closing one tab flushes only that tab", async () => {
    const first = billingCoordinator.addTab(TRANSACTION_TYPE.SALE, "/billing/sales/create")!;
    const second = billingCoordinator.addTab(
      TRANSACTION_TYPE.ESTIMATE,
      "/billing/estimates/create"
    )!;
    const flush = vi.spyOn(billingSyncCoordinator, "flush").mockResolvedValue(undefined);
    vi.spyOn(billingSyncCoordinator, "cancel").mockImplementation(() => undefined);

    await billingCoordinator.flushAndRemoveTab(first.id);

    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledWith(first.id);
    expect(useBillingSessionStore.getState().sessions[first.id]).toBeUndefined();
    expect(useBillingSessionStore.getState().sessions[second.id]).toBeDefined();
  });

  it("discarding one local draft never removes another tab", () => {
    const first = billingCoordinator.addTab(TRANSACTION_TYPE.SALE, "/billing/sales/create")!;
    const second = billingCoordinator.addTab(
      TRANSACTION_TYPE.ESTIMATE,
      "/billing/estimates/create"
    )!;
    vi.spyOn(billingSyncCoordinator, "cancel").mockImplementation(() => undefined);

    billingCoordinator.removeTab(first.id, { discard: true });

    expect(useBillingTabsStore.getState().tabs.map((tab) => tab.id)).toEqual([second.id]);
    expect(useBillingSessionStore.getState().sessions[first.id]).toBeUndefined();
    expect(useBillingSessionStore.getState().sessions[second.id]).toBeDefined();
  });
});
