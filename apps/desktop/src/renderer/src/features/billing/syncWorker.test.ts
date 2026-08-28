import type { BillingProductDTO, SyncResponse } from "@shared/types";
import { BILLSTATUS, TRANSACTION_TYPE } from "@shared/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const postMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apiClient")>();
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      post: postMock
    }
  };
});

import { ApiError } from "@/lib/apiClient";
import { SYNCSTATUS } from "@/types/renderer.types";
import { useSearchDropdownStore } from "./product-search/searchDropdown.store";
import { useBillingSessionStore } from "./store/billingSession.store";
import { useBillingTabsStore } from "./store/billingTabs.store";
import {
  cancelSyncQueue,
  createBillingSyncCoordinator,
  flushSync,
  processSyncQueue
} from "./syncWorker";

const activeTabs = new Set<string>();

function product(name = "Autosave Product"): BillingProductDTO {
  return {
    id: crypto.randomUUID(),
    name,
    productSnapshot: `${name} snapshot`,
    weight: null,
    unit: null,
    mrp: 7500,
    price: 6800,
    purchasePrice: 5000
  };
}

function initTab(
  options: {
    tabId?: string;
    billingId?: string | null;
    type?: "sale" | "estimate";
  } = {}
) {
  const tabId = options.tabId ?? crypto.randomUUID();
  const type = options.type ?? TRANSACTION_TYPE.SALE;
  activeTabs.add(tabId);
  useBillingTabsStore.setState((state) => ({
    tabs: [
      ...state.tabs,
      {
        id: tabId,
        type,
        transactionNo: options.billingId ? 1 : null,
        routePath: options.billingId
          ? `/billing/${type}s/${options.billingId}/edit`
          : `/billing/${type}s/create`
      }
    ],
    activeTabId: tabId
  }));
  const store = useBillingSessionStore.getState();
  store.initSession(tabId);
  store.hydrateSession(tabId, {
    billingType: type,
    customerId: crypto.randomUUID(),
    billingId: options.billingId ?? null
  });
  const rowId = useBillingSessionStore.getState().sessions[tabId]!.lineItems[0]!.rowId;
  store.addLineItem(tabId, rowId, product());
  return { tabId, rowId };
}

function success(rowId: string, billingId = crypto.randomUUID()): SyncResponse {
  return {
    billingId,
    transactionNo: 1,
    syncedItems: [{ rowId, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }],
    deletedRowIds: []
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  postMock.mockReset();
  useBillingSessionStore.setState({ sessions: {} });
  useBillingTabsStore.setState({ tabs: [], activeTabId: null });
  useSearchDropdownStore.getState().reset();
});

afterEach(() => {
  for (const tabId of activeTabs) cancelSyncQueue(tabId, true);
  activeTabs.clear();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("billing autosave state machine", () => {
  it("waits 800 ms and coalesces rapid edits into one latest payload", async () => {
    const { tabId, rowId } = initTab();
    postMock.mockResolvedValue(success(rowId));

    processSyncQueue(tabId);
    await vi.advanceTimersByTimeAsync(400);
    useBillingSessionStore.getState().updateLineItem(tabId, rowId, "quantity", "2.125");
    processSyncQueue(tabId);
    await vi.advanceTimersByTimeAsync(799);
    expect(postMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0]?.[1]).toMatchObject({
      data: {
        items: [{ rowId, quantity: 2125 }]
      }
    });
  });

  it("sends a newer row value after an older response completes", async () => {
    const { tabId, rowId } = initTab({ billingId: crypto.randomUUID() });
    const first = deferred<SyncResponse>();
    postMock.mockReturnValueOnce(first.promise).mockResolvedValueOnce(success(rowId));

    processSyncQueue(tabId);
    await vi.advanceTimersByTimeAsync(800);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(useBillingSessionStore.getState().sessions[tabId]?.status).toBe(BILLSTATUS.SAVING);

    useBillingSessionStore.getState().updateLineItem(tabId, rowId, "quantity", "3.125");
    processSyncQueue(tabId);
    first.resolve(success(rowId));
    await vi.advanceTimersByTimeAsync(800);

    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[1]?.[1]).toMatchObject({
      data: {
        items: [{ rowId, quantity: 3125 }]
      }
    });
  });

  it("retains Error after a non-retryable failure and does not loop", async () => {
    const { tabId } = initTab({ billingId: crypto.randomUUID() });
    postMock.mockRejectedValue(new ApiError("invalid row", 400));

    processSyncQueue(tabId);
    await vi.advanceTimersByTimeAsync(800);
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(useBillingSessionStore.getState().sessions[tabId]?.status).toBe(BILLSTATUS.ERROR);
    await vi.advanceTimersByTimeAsync(5000);
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it("turns the 15-second request timeout into Error, never Saved", async () => {
    const { tabId } = initTab({ billingId: crypto.randomUUID() });
    postMock.mockImplementation(
      (_endpoint: string, _payload: unknown, options: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError"))
          );
        })
    );

    processSyncQueue(tabId);
    await vi.advanceTimersByTimeAsync(800);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(useBillingSessionStore.getState().sessions[tabId]?.status).toBe(BILLSTATUS.ERROR);
  });

  it("keeps two tab queues isolated by endpoint and row ID", async () => {
    const firstId = crypto.randomUUID();
    const secondId = crypto.randomUUID();
    const first = initTab({ tabId: "first-tab", billingId: firstId });
    const second = initTab({ tabId: "second-tab", billingId: secondId });
    postMock.mockImplementation(
      async (_endpoint: string, payload: { data: { items: Array<{ rowId: string }> } }) =>
        success(payload.data.items[0]!.rowId)
    );

    useBillingSessionStore.getState().updateLineItem(first.tabId, first.rowId, "quantity", "2");
    useBillingSessionStore.getState().updateLineItem(second.tabId, second.rowId, "quantity", "3");
    processSyncQueue(first.tabId);
    processSyncQueue(second.tabId);
    await vi.advanceTimersByTimeAsync(800);

    expect(postMock.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining([`/api/sales/${firstId}/sync`, `/api/sales/${secondId}/sync`])
    );
    const rowIds = postMock.mock.calls.map(
      (call) => (call[1] as { data: { items: Array<{ rowId: string }> } }).data.items[0]!.rowId
    );
    expect(rowIds).toEqual(expect.arrayContaining([first.rowId, second.rowId]));
  });

  it("rejects flushSync immediately for dirty metadata plus an invalid new row", async () => {
    const { tabId, rowId } = initTab();
    useBillingSessionStore.getState().updateLineItem(tabId, rowId, "price", "");
    useBillingSessionStore.getState().updatePersistentField(tabId, "notes", "Unsaved metadata");

    await expect(flushSync(tabId)).rejects.toThrow(/valid item and customer/i);
    expect(postMock).not.toHaveBeenCalled();
    expect(useBillingSessionStore.getState().sessions[tabId]?.lineItems[0]).toMatchObject({
      price: "",
      syncStatus: SYNCSTATUS.IS_DIRTY
    });
  });

  it("applies create identity, route, transaction number, and item IDs", async () => {
    const { tabId, rowId } = initTab();
    const billingId = crypto.randomUUID();
    const itemId = crypto.randomUUID();
    postMock.mockResolvedValue({
      billingId,
      transactionNo: 42,
      syncedItems: [{ rowId, id: itemId, updatedAt: new Date().toISOString() }],
      deletedRowIds: []
    } satisfies SyncResponse);

    await flushSync(tabId);

    const session = useBillingSessionStore.getState().sessions[tabId]!;
    expect(session).toMatchObject({
      billingId,
      transactionNo: 42,
      status: BILLSTATUS.SAVED
    });
    expect(session.lineItems.find((item) => item.rowId === rowId)).toMatchObject({
      id: itemId,
      syncStatus: SYNCSTATUS.SYNCED
    });
    expect(useBillingTabsStore.getState().tabs.find((tab) => tab.id === tabId)).toMatchObject({
      routePath: `/billing/sales/${billingId}/edit`,
      transactionNo: 42
    });
  });

  it("flushes a metadata-only edit for an existing bill", async () => {
    const { tabId, rowId } = initTab({ billingId: crypto.randomUUID() });
    postMock.mockResolvedValueOnce(success(rowId));
    await flushSync(tabId);
    postMock.mockReset();
    postMock.mockResolvedValue({
      billingId: useBillingSessionStore.getState().sessions[tabId]!.billingId!,
      transactionNo: 1,
      syncedItems: [],
      deletedRowIds: []
    } satisfies SyncResponse);

    useBillingSessionStore.getState().updatePersistentField(tabId, "notes", "metadata only");
    await flushSync(tabId);

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0]?.[1]).toMatchObject({
      data: { notes: "metadata only", items: [] }
    });
    const session = useBillingSessionStore.getState().sessions[tabId]!;
    expect(session.persistedMetadataRevision).toBe(session.metadataRevision);
    expect(session.status).toBe(BILLSTATUS.SAVED);
  });

  it("deletes a row changed during its create request in a follow-up sync", async () => {
    const { tabId, rowId } = initTab();
    const billingId = crypto.randomUUID();
    const itemId = crypto.randomUUID();
    const first = deferred<SyncResponse>();
    postMock.mockReturnValueOnce(first.promise).mockResolvedValueOnce({
      billingId,
      transactionNo: 7,
      syncedItems: [],
      deletedRowIds: [rowId]
    } satisfies SyncResponse);

    const flushing = flushSync(tabId);
    await vi.waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    useBillingSessionStore.getState().deleteLineItem(tabId, rowId);
    first.resolve({
      billingId,
      transactionNo: 7,
      syncedItems: [{ rowId, id: itemId, updatedAt: new Date().toISOString() }],
      deletedRowIds: []
    });
    await flushing;

    expect(postMock).toHaveBeenCalledTimes(2);
    expect(postMock.mock.calls[1]?.[0]).toBe(`/api/sales/${billingId}/sync`);
    expect(postMock.mock.calls[1]?.[1]).toMatchObject({
      data: { items: [expect.objectContaining({ rowId, id: itemId, isDeleted: true })] }
    });
    expect(
      useBillingSessionStore
        .getState()
        .sessions[tabId]!.lineItems.some((item) => item.rowId === rowId)
    ).toBe(false);
  });

  it("rejects a failed flush, preserves pending work, and becomes Saved only after retry", async () => {
    const { tabId, rowId } = initTab({ billingId: crypto.randomUUID() });
    postMock.mockRejectedValueOnce(new TypeError("network down"));

    await expect(flushSync(tabId)).rejects.toThrow("network down");
    const failedSession = useBillingSessionStore.getState().sessions[tabId]!;
    expect(failedSession.status).toBe(BILLSTATUS.ERROR);
    expect(failedSession.lineItems.find((item) => item.rowId === rowId)).toMatchObject({
      syncStatus: SYNCSTATUS.IS_DIRTY
    });

    postMock.mockResolvedValueOnce(success(rowId));
    await flushSync(tabId);
    expect(useBillingSessionStore.getState().sessions[tabId]?.status).toBe(BILLSTATUS.SAVED);
  });

  it("uses injected transport and timer dependencies", async () => {
    const { tabId, rowId } = initTab({ tabId: "injected-dependencies" });
    const setTimeoutMock = vi.fn((callback: () => void, delay: number) =>
      globalThis.setTimeout(callback, delay)
    );
    const clearTimeoutMock = vi.fn((handle: ReturnType<typeof globalThis.setTimeout>) =>
      globalThis.clearTimeout(handle)
    );
    const coordinator = createBillingSyncCoordinator({
      transport: { post: postMock },
      timers: { setTimeout: setTimeoutMock, clearTimeout: clearTimeoutMock },
      debounceMs: 25,
      requestTimeoutMs: 100
    });
    postMock.mockResolvedValue(success(rowId));

    coordinator.schedule(tabId);
    expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), 25);
    await vi.advanceTimersByTimeAsync(25);
    await vi.waitFor(() =>
      expect(useBillingSessionStore.getState().sessions[tabId]?.status).toBe(BILLSTATUS.SAVED)
    );
    expect(setTimeoutMock).toHaveBeenCalledWith(expect.any(Function), 100);
    expect(clearTimeoutMock).toHaveBeenCalled();
    coordinator.cancel(tabId);
  });

  it("rejects an incomplete acknowledgement, preserves the row, and never zero-delay retries", async () => {
    const { tabId, rowId } = initTab({ billingId: crypto.randomUUID() });
    postMock
      .mockResolvedValueOnce({ syncedItems: [], deletedRowIds: [] } satisfies SyncResponse)
      .mockRejectedValueOnce(new Error("unexpected automatic retry after incomplete response"));

    const failure = await flushSync(tabId).then(
      () => null,
      (error: unknown) => error
    );

    expect.soft(failure).toMatchObject({ name: "BillingSyncProtocolError" });
    expect.soft(postMock).toHaveBeenCalledTimes(1);
    expect.soft(useBillingSessionStore.getState().sessions[tabId]?.status).toBe(BILLSTATUS.ERROR);
    expect
      .soft(
        useBillingSessionStore
          .getState()
          .sessions[tabId]?.lineItems.find((item) => item.rowId === rowId)?.syncStatus
      )
      .toBe(SYNCSTATUS.IS_DIRTY);
    await vi.advanceTimersByTimeAsync(5000);
    expect.soft(postMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "unknown row ID",
      (rowId: string) => ({
        syncedItems: [
          { rowId, id: crypto.randomUUID(), updatedAt: new Date().toISOString() },
          {
            rowId: crypto.randomUUID(),
            id: crypto.randomUUID(),
            updatedAt: new Date().toISOString()
          }
        ],
        deletedRowIds: []
      })
    ],
    [
      "duplicate row ID",
      (rowId: string) => ({
        syncedItems: [
          { rowId, id: crypto.randomUUID(), updatedAt: new Date().toISOString() },
          { rowId, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }
        ],
        deletedRowIds: []
      })
    ]
  ] as const)("rejects a sync response containing an %s", async (_label, responseFor) => {
    const { tabId, rowId } = initTab({ billingId: crypto.randomUUID() });
    postMock.mockResolvedValue(responseFor(rowId) satisfies SyncResponse);

    const failure = await flushSync(tabId).then(
      () => null,
      (error: unknown) => error
    );

    expect.soft(failure).toMatchObject({ name: "BillingSyncProtocolError" });
    expect.soft(postMock).toHaveBeenCalledTimes(1);
    expect.soft(useBillingSessionStore.getState().sessions[tabId]?.status).toBe(BILLSTATUS.ERROR);
    expect
      .soft(
        useBillingSessionStore
          .getState()
          .sessions[tabId]?.lineItems.find((item) => item.rowId === rowId)?.syncStatus
      )
      .toBe(SYNCSTATUS.IS_DIRTY);
  });

  it("rejects flush while a product replacement draft is still unconfirmed", async () => {
    const { tabId, rowId } = initTab({ billingId: crypto.randomUUID() });
    postMock.mockResolvedValueOnce(success(rowId));
    await flushSync(tabId);
    postMock.mockReset();
    useSearchDropdownStore.getState().setActiveRowId(rowId);
    useSearchDropdownStore.getState().setItemQuery("Half typed replacement");

    const failure = await flushSync(tabId).then(
      () => null,
      (error: unknown) => error
    );

    expect.soft(failure).toMatchObject({ name: "BillingPersistenceError" });
    expect.soft(postMock).not.toHaveBeenCalled();
    expect
      .soft(useBillingSessionStore.getState().sessions[tabId]?.status)
      .not.toBe(BILLSTATUS.SAVED);
  });

  it("shares one flushAll promise for simultaneous workspace exits without duplicate posts", async () => {
    const { tabId, rowId } = initTab({ tabId: "shared-workspace-exit" });
    const response = deferred<unknown>();
    postMock.mockReturnValue(response.promise);
    const coordinator = createBillingSyncCoordinator({ transport: { post: postMock } });

    const firstExit = coordinator.flushAll();
    const secondExit = coordinator.flushAll();

    expect.soft(secondExit).toBe(firstExit);
    await vi.waitFor(() => expect(postMock).toHaveBeenCalledTimes(1));
    response.resolve(success(rowId));
    await Promise.all([firstExit, secondExit]);
    expect.soft(postMock).toHaveBeenCalledTimes(1);
    coordinator.cancel(tabId);
  });

  it("flushes every open sale and estimate tab before leaving Billing", async () => {
    const sale = initTab({ tabId: "open-sale", billingId: crypto.randomUUID() });
    const estimate = initTab({
      tabId: "open-estimate",
      billingId: crypto.randomUUID(),
      type: TRANSACTION_TYPE.ESTIMATE
    });
    postMock.mockImplementation(
      async (_endpoint: string, payload: { data: { items: Array<{ rowId: string }> } }) =>
        success(payload.data.items[0]!.rowId)
    );
    const coordinator = createBillingSyncCoordinator({ transport: { post: postMock } });

    await coordinator.flushAll();

    expect(postMock.mock.calls.map((call) => call[0])).toEqual(
      expect.arrayContaining([
        `/api/sales/${useBillingSessionStore.getState().sessions[sale.tabId]!.billingId}/sync`,
        `/api/estimates/${useBillingSessionStore.getState().sessions[estimate.tabId]!.billingId}/sync`
      ])
    );
    coordinator.cancel(sale.tabId);
    coordinator.cancel(estimate.tabId);
  });

  it("identifies the invalid tab that prevents a workspace exit", async () => {
    const valid = initTab({ tabId: "valid-sale", billingId: crypto.randomUUID() });
    const invalid = initTab({
      tabId: "invalid-estimate",
      billingId: crypto.randomUUID(),
      type: TRANSACTION_TYPE.ESTIMATE
    });
    useBillingSessionStore.getState().hydrateSession(invalid.tabId, { customerId: null });
    postMock.mockImplementation(
      async (_endpoint: string, payload: { data: { items: Array<{ rowId: string }> } }) =>
        success(payload.data.items[0]!.rowId)
    );
    const coordinator = createBillingSyncCoordinator({ transport: { post: postMock } });

    const failure = await coordinator.flushAll().then(
      () => null,
      (error: unknown) => error
    );

    expect(failure).toMatchObject({ message: expect.stringContaining(invalid.tabId) });
    coordinator.cancel(valid.tabId, { discard: true });
    coordinator.cancel(invalid.tabId, { discard: true });
  });

  it("does not abort and discard a create request whose server outcome is unknown", async () => {
    const { tabId } = initTab({ tabId: "unknown-create-outcome" });
    const request = deferred<unknown>();
    let requestSignal: AbortSignal | undefined;
    const transport = {
      post: vi.fn((_endpoint: string, _payload: unknown, options?: { signal?: AbortSignal }) => {
        requestSignal = options?.signal;
        return request.promise;
      })
    };
    const coordinator = createBillingSyncCoordinator({ transport });
    const flushing = coordinator.flush(tabId);
    await vi.waitFor(() => expect(transport.post).toHaveBeenCalledTimes(1));

    let discardError: unknown = null;
    try {
      coordinator.cancel(tabId, { discard: true });
    } catch (error) {
      discardError = error;
    }

    expect.soft(discardError).toMatchObject({ name: "BillingPersistenceError" });
    expect.soft(requestSignal?.aborted).toBe(false);
    expect.soft(useBillingSessionStore.getState().sessions[tabId]).toBeDefined();
    request.reject(new Error("create outcome is unknown"));
    await flushing.catch(() => undefined);
  });
});
