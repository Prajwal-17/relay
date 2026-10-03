import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SyncResponse, UnifiedTransctionWithItems } from "../../../../shared/types";
import { estimateItems, estimates, products } from "../../../../main/db/schema";
import { estimatesController } from "../../../../main/modules/estimates/estimates.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  estimatePayload,
  getJson,
  postTxn,
  readJson,
  seedCustomer,
  seedEstimate,
  transactionItem,
  type DB
} from "../../../../main/tests/helpers";
import { useBillingSessionStore } from "./store/billingSession.store";
import { createRequestSnapshot } from "./syncWorker.helpers";

describe("legacy estimate billing round trip", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    useBillingSessionStore.setState({ sessions: {} });
    app = createModuleTestApp([{ path: "/api/estimates", controller: estimatesController }]);
  });

  afterEach(() => {
    useBillingSessionStore.setState({ sessions: {} });
    dbMock.instance = null;
    sqlite?.close();
  });

  it.each(["checked quantity", "quantity", "price", "deletion"])(
    "saves a legacy custom item's %s without reselecting a product",
    async (edit) => {
      const customer = await seedCustomer(db);
      const estimate = await seedEstimate(db, {
        estimateNo: 585,
        customerId: customer.id,
        createdAt: "2026-09-19T07:33:00.000Z",
        grandTotal: 92000,
        totalQuantity: 20000
      });
      const item = db
        .insert(estimateItems)
        .values({
          estimateId: estimate.id,
          productId: null,
          name: "",
          productSnapshot: "IDLI RAVA PKT",
          weight: null,
          unit: null,
          mrp: null,
          purchasePrice: null,
          price: 4600,
          quantity: 20000,
          totalPrice: 92000,
          checkedQty: 20000,
          position: 131072
        })
        .returning()
        .get();

      const rejected = await postTxn(
        app,
        `/api/estimates/${estimate.id}/sync`,
        estimatePayload(customer.id, { items: [transactionItem({ ...item, checkedQty: 0 })] })
      );
      expect(rejected.status).toBe(400);
      expect(await rejected.json()).toMatchObject({
        error: { details: [{ field: "data.items.0.name" }] }
      });

      const loadedResponse = await getJson(app, `/api/estimates/${estimate.id}`);
      expect(loadedResponse.status).toBe(200);
      const loaded = await readJson<UnifiedTransctionWithItems>(loadedResponse);
      const tabId = crypto.randomUUID();
      const store = useBillingSessionStore.getState();
      store.initSession(tabId);
      store.hydrateSession(tabId, {
        billingId: loaded.id,
        billingType: loaded.type,
        transactionNo: loaded.transactionNo,
        customerId: loaded.customerId,
        billingDate: new Date(loaded.createdAt!)
      });
      store.setLineItems(tabId, loaded.items);
      const rowId = useBillingSessionStore.getState().sessions[tabId]!.lineItems[0]!.rowId;

      if (edit === "deletion") store.deleteLineItem(tabId, rowId);
      else if (edit === "checked quantity") store.updateLineItem(tabId, rowId, "checkedQty", 0);
      else if (edit === "quantity") store.updateLineItem(tabId, rowId, "quantity", "21");
      else store.updateLineItem(tabId, rowId, "price", "47");

      const snapshot = createRequestSnapshot(useBillingSessionStore.getState().sessions[tabId]!);
      expect(snapshot?.payload.data.items).toHaveLength(1);
      const response = await postTxn(
        app,
        `/api/estimates/${estimate.id}/sync`,
        snapshot!.payload.data
      );
      const result = await readJson<SyncResponse>(response);
      expect(response.status, JSON.stringify(result)).toBe(200);

      const savedItem = db.select().from(estimateItems).where(eq(estimateItems.id, item.id)).get();
      if (edit === "deletion") {
        expect(result.deletedRowIds).toEqual([rowId]);
        expect(savedItem).toBeUndefined();
      } else {
        expect(result.syncedItems).toEqual([{ rowId, id: item.id, updatedAt: expect.any(String) }]);
        expect(savedItem).toMatchObject({
          productId: null,
          name: item.productSnapshot,
          productSnapshot: item.productSnapshot,
          weight: null,
          unit: null,
          mrp: null,
          purchasePrice: null,
          price: edit === "price" ? 4700 : 4600,
          quantity: edit === "quantity" ? 21000 : 20000,
          checkedQty: edit === "checked quantity" ? 0 : 20000,
          totalPrice: edit === "price" ? 94000 : edit === "quantity" ? 96600 : 92000,
          position: item.position
        });
      }
      expect(db.select().from(estimates).where(eq(estimates.id, estimate.id)).get()).toMatchObject({
        createdAt: estimate.createdAt,
        grandTotal: savedItem?.totalPrice ?? 0,
        totalQuantity: savedItem?.quantity ?? 0
      });
      expect(db.select().from(products).all()).toEqual([]);
    }
  );
});
