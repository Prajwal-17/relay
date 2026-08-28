import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import type { BillingSessionData } from "@/features/billing/store/billingSession.types";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { apiClient } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import { BILLSTATUS } from "@shared/types";
import {
  createRequestSnapshot,
  hasPendingBillingWork,
  hasUnconfirmedProductDraft,
  type RequestSnapshot
} from "./syncWorker.helpers";
import { validateSyncResponse } from "./syncWorker.protocol";

export { BillingSyncProtocolError } from "./syncWorker.protocol";

const DEFAULT_DEBOUNCE_MS = 800;
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

export type BillingSyncTransport = {
  post(endpoint: string, payload: unknown, options?: { signal?: AbortSignal }): Promise<unknown>;
};

export type BillingSyncTimerDependencies = {
  setTimeout(callback: () => void, delay: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
};

export type CreateBillingSyncCoordinatorOptions = {
  transport: BillingSyncTransport;
  timers?: BillingSyncTimerDependencies;
  debounceMs?: number;
  requestTimeoutMs?: number;
};

type TabQueueState = {
  timer: TimerHandle | null;
  inFlight: Promise<void> | null;
  abortController: AbortController | null;
  inFlightIsCreate: boolean;
  rerunAfterFlight: boolean;
};

export class BillingPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingPersistenceError";
  }
}

export function createBillingSyncCoordinator({
  transport,
  timers = {
    setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
    clearTimeout: (handle) => globalThis.clearTimeout(handle)
  },
  debounceMs = DEFAULT_DEBOUNCE_MS,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS
}: CreateBillingSyncCoordinatorOptions) {
  const queues = new Map<string, TabQueueState>();
  let flushAllInFlight: Promise<void> | null = null;

  const getQueue = (tabId: string): TabQueueState => {
    let queue = queues.get(tabId);
    if (!queue) {
      queue = {
        timer: null,
        inFlight: null,
        abortController: null,
        inFlightIsCreate: false,
        rerunAfterFlight: false
      };
      queues.set(tabId, queue);
    }
    return queue;
  };

  const clearDebounce = (queue: TabQueueState) => {
    if (!queue.timer) return;
    timers.clearTimeout(queue.timer);
    queue.timer = null;
  };

  const setStatus = (tabId: string, status: BillingSessionData["status"]) => {
    useBillingSessionStore.getState().updateUiField(tabId, "status", status);
  };

  const queueRun = (tabId: string, delay: number) => {
    const queue = getQueue(tabId);
    clearDebounce(queue);
    queue.timer = timers.setTimeout(() => {
      queue.timer = null;
      void runScheduled(tabId).catch(() => undefined);
    }, delay);
  };

  const startRequest = (tabId: string, snapshot: RequestSnapshot): Promise<void> => {
    const queue = getQueue(tabId);
    if (queue.inFlight) {
      queue.rerunAfterFlight = true;
      return queue.inFlight;
    }

    const store = useBillingSessionStore.getState();
    store.markItemsAsSaving(tabId, snapshot.itemRevisions);
    store.updateUiField(tabId, "status", BILLSTATUS.SAVING);

    const controller = new AbortController();
    queue.abortController = controller;
    queue.inFlightIsCreate = !snapshot.billingId;
    const timeout = timers.setTimeout(() => controller.abort(), requestTimeoutMs);
    let succeeded = false;

    const request = (async () => {
      try {
        const endpoint = snapshot.billingId
          ? `/api/${snapshot.billingType}s/${snapshot.billingId}/sync`
          : `/api/${snapshot.billingType}s/create`;
        const response = await transport.post(endpoint, snapshot.payload, {
          signal: controller.signal
        });
        validateSyncResponse(response, snapshot);

        const currentStore = useBillingSessionStore.getState();
        if (!snapshot.billingId && response.billingId) {
          currentStore.updateUiField(tabId, "billingId", response.billingId);
          if (response.transactionNo !== undefined) {
            currentStore.updateUiField(tabId, "transactionNo", response.transactionNo);
          }
          useBillingTabsStore.getState().updateTab(tabId, {
            routePath: `/billing/${snapshot.billingType}s/${response.billingId}/edit`,
            transactionNo: response.transactionNo ?? null
          });
        }

        currentStore.acknowledgeSync(tabId, {
          itemRevisions: snapshot.itemRevisions,
          metadataRevision: snapshot.metadataRevision,
          itemIds: new Map(response.syncedItems.map((item) => [item.rowId, item.id])),
          deletedRowIds: new Set(response.deletedRowIds)
        });
        void queryClient.invalidateQueries({
          queryKey: ["customer-ledger", snapshot.customerId],
          exact: false
        });
        void queryClient.invalidateQueries({
          queryKey: ["customer-ledger-summary", snapshot.customerId]
        });
        succeeded = true;

        if (hasPendingBillingWork(tabId)) setStatus(tabId, BILLSTATUS.UNSAVED);
        else setStatus(tabId, BILLSTATUS.SAVED);
      } catch (error) {
        useBillingSessionStore.getState().failSync(tabId, snapshot.itemRevisions);
        setStatus(tabId, BILLSTATUS.ERROR);
        console.error("Billing sync failed", error);
        throw error;
      } finally {
        timers.clearTimeout(timeout);
        queue.abortController = null;
        queue.inFlightIsCreate = false;
      }
    })();

    queue.inFlight = request.finally(() => {
      queue.inFlight = null;
      const shouldRerun = queue.rerunAfterFlight;
      queue.rerunAfterFlight = false;
      if (succeeded && hasPendingBillingWork(tabId) && (shouldRerun || !queue.timer)) {
        queueRun(tabId, 0);
      }
    });
    return queue.inFlight;
  };

  async function runScheduled(tabId: string): Promise<void> {
    const queue = getQueue(tabId);
    if (queue.inFlight) {
      queue.rerunAfterFlight = true;
      await queue.inFlight;
      return;
    }

    const session = useBillingSessionStore.getState().sessions[tabId];
    if (!session) return;
    if (!hasPendingBillingWork(tabId)) {
      if (session.status !== BILLSTATUS.IDLE) setStatus(tabId, BILLSTATUS.SAVED);
      return;
    }

    const snapshot = createRequestSnapshot(session);
    if (!snapshot) {
      setStatus(tabId, BILLSTATUS.UNSAVED);
      return;
    }
    await startRequest(tabId, snapshot);
  }

  const schedule = (tabId: string) => {
    if (!useBillingSessionStore.getState().sessions[tabId]) return;
    setStatus(tabId, BILLSTATUS.UNSAVED);
    queueRun(tabId, debounceMs);
  };

  const flush = async (tabId: string): Promise<void> => {
    if (hasUnconfirmedProductDraft(tabId)) {
      setStatus(tabId, BILLSTATUS.UNSAVED);
      throw new BillingPersistenceError("Select a product or clear the unfinished product search.");
    }

    const queue = getQueue(tabId);
    clearDebounce(queue);
    if (queue.inFlight) await queue.inFlight;

    while (hasPendingBillingWork(tabId)) {
      const session = useBillingSessionStore.getState().sessions[tabId];
      if (!session) return;
      const snapshot = createRequestSnapshot(session);
      if (!snapshot) {
        setStatus(tabId, BILLSTATUS.UNSAVED);
        throw new BillingPersistenceError("Add a valid item and customer before saving this bill.");
      }
      await startRequest(tabId, snapshot);
      clearDebounce(queue);
    }

    if (hasUnconfirmedProductDraft(tabId)) {
      setStatus(tabId, BILLSTATUS.UNSAVED);
      throw new BillingPersistenceError("Select a product or clear the unfinished product search.");
    }
  };

  const flushAll = (): Promise<void> => {
    if (flushAllInFlight) return flushAllInFlight;
    const tabIds = Object.keys(useBillingSessionStore.getState().sessions);
    const run = Promise.all(
      tabIds.map(async (tabId) => {
        try {
          await flush(tabId);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown persistence error";
          throw new BillingPersistenceError(`Billing tab ${tabId}: ${message}`);
        }
      })
    ).then(() => undefined);
    const shared = run.finally(() => {
      if (flushAllInFlight === shared) flushAllInFlight = null;
    });
    flushAllInFlight = shared;
    return shared;
  };

  const cancel = (tabId: string, options: { discard?: boolean } = {}) => {
    const queue = queues.get(tabId);
    if (options.discard && queue?.inFlight && queue.inFlightIsCreate) {
      throw new BillingPersistenceError(
        "Wait for the initial billing request to finish before discarding it."
      );
    }
    if (
      !options.discard &&
      (queue?.inFlight || hasPendingBillingWork(tabId) || hasUnconfirmedProductDraft(tabId))
    ) {
      throw new BillingPersistenceError(
        "Billing work must be saved or explicitly discarded first."
      );
    }
    if (!queue) return;
    clearDebounce(queue);
    if (options.discard) queue.abortController?.abort();
    queues.delete(tabId);
  };

  const cancelAll = (options: { discard?: boolean } = {}) => {
    const tabIds = new Set([
      ...queues.keys(),
      ...Object.keys(useBillingSessionStore.getState().sessions)
    ]);
    for (const tabId of tabIds) cancel(tabId, options);
  };

  return {
    schedule,
    flush,
    flushAll,
    cancel,
    cancelAll,
    isSyncing: (tabId: string) => Boolean(queues.get(tabId)?.inFlight)
  };
}

export const billingSyncCoordinator = createBillingSyncCoordinator({ transport: apiClient });

export const processSyncQueue = (tabId: string) => billingSyncCoordinator.schedule(tabId);
export const flushSync = (tabId: string) => billingSyncCoordinator.flush(tabId);
export const flushAllSync = () => billingSyncCoordinator.flushAll();
export const isSyncing = (tabId: string) => billingSyncCoordinator.isSyncing(tabId);
export const cancelSyncQueue = (tabId: string, discard = false) =>
  billingSyncCoordinator.cancel(tabId, { discard });
