import { asc, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SyncResponse, TxnPayloadData } from "../../../../shared/types";
import { estimateItems, estimates, products } from "../../../db/schema";
import { estimatesController } from "../../../modules/estimates/estimates.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  estimatePayload,
  postTxn,
  readJson,
  seedCustomer,
  seedEstimate,
  seedEstimateItem,
  seedProduct,
  transactionItem,
  type DB
} from "../../helpers";

type EstimatePayload = Extract<TxnPayloadData, { transactionType: "estimate" }>;

describe("estimate sync ambiguous-commit regressions", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([{ path: "/api/estimates", controller: estimatesController }]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  function buildItems(count: number, product: typeof products.$inferSelect) {
    return Array.from({ length: count }, (_, index) =>
      transactionItem({
        rowId: crypto.randomUUID(),
        productId: product.id,
        name: `Estimate item ${index + 1}`,
        productSnapshot: `Estimate item ${index + 1} snapshot`,
        price: 10_000 + index * 100,
        quantity: 1000,
        position: index * 65_536
      })
    );
  }

  function withCreateIdentity(payload: EstimatePayload) {
    return {
      ...payload,
      billingId: crypto.randomUUID(),
      creationToken: crypto.randomUUID()
    } satisfies EstimatePayload;
  }

  it.each([10, 12, 15])(
    "persists all %i rows atomically when the create acknowledgement arrives",
    async (itemCount) => {
      const customer = await seedCustomer(db);
      const product = await seedProduct(db, { totalQuantitySold: 0 });
      const payload = withCreateIdentity(
        estimatePayload(customer.id, { items: buildItems(itemCount, product) })
      );

      const response = await postTxn(app, "/api/estimates/create", payload);
      const body = await readJson<SyncResponse>(response);
      const storedItems = db
        .select()
        .from(estimateItems)
        .where(eq(estimateItems.estimateId, payload.billingId!))
        .orderBy(asc(estimateItems.position))
        .all();

      expect.soft(response.status).toBe(200);
      expect.soft(body.syncedItems).toHaveLength(itemCount);
      expect.soft(storedItems).toHaveLength(itemCount);
      expect
        .soft(storedItems.map((item) => item.name))
        .toEqual(payload.items.map((item) => item.name));
      expect
        .soft(db.select().from(estimates).where(eq(estimates.id, payload.billingId!)).get())
        .toMatchObject({ totalQuantity: itemCount * 1000 });
      expect
        .soft(db.select().from(products).where(eq(products.id, product.id)).get())
        .toMatchObject({ totalQuantitySold: itemCount * 1000 });
    }
  );

  it("characterizes a 409 when a 12-row ambiguous create is replayed with 15 rows", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 0 });
    const originalItems = buildItems(12, product);
    const original = withCreateIdentity(estimatePayload(customer.id, { items: originalItems }));

    // The first response is intentionally ignored: this models a timeout or a connection loss
    // after SQLite committed but before the renderer received the acknowledgement.
    const committedResponse = await postTxn(app, "/api/estimates/create", original);
    expect(committedResponse.status).toBe(200);

    const retry = await postTxn(app, "/api/estimates/create", {
      ...original,
      items: [...originalItems, ...buildItems(3, product)]
    });
    const retryBody = await readJson<{ error: { message: string } }>(retry);
    const persisted = db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, original.billingId!))
      .all();

    expect.soft(retry.status).toBe(409);
    expect
      .soft(retryBody.error.message)
      .toBe("Estimate replay does not match the original request");
    expect.soft(persisted).toHaveLength(12);
    expect
      .soft(persisted.map((item) => item.name).sort())
      .toEqual(originalItems.map((item) => item.name).sort());
    expect
      .soft(db.select().from(products).where(eq(products.id, product.id)).get())
      .toMatchObject({ totalQuantitySold: 12_000 });
  });

  it("documents a stale success acknowledgement when a changed replay keeps the same row count", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 0 });
    const originalItems = buildItems(12, product);
    const original = withCreateIdentity(estimatePayload(customer.id, { items: originalItems }));
    const first = await postTxn(app, "/api/estimates/create", original);
    expect(first.status).toBe(200);

    const changedItems = originalItems.map((item, index) =>
      index >= 9
        ? {
            ...item,
            name: `${item.name} changed after commit`,
            productSnapshot: `${item.productSnapshot} changed after commit`,
            quantity: 2000
          }
        : item
    );
    const replay = await postTxn(app, "/api/estimates/create", {
      ...original,
      notes: "changed after commit",
      items: changedItems
    });
    const replayBody = await readJson<SyncResponse>(replay);
    const persisted = db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, original.billingId!))
      .orderBy(asc(estimateItems.position))
      .all();
    const persistedEstimate = db
      .select()
      .from(estimates)
      .where(eq(estimates.id, original.billingId!))
      .get();

    // This is characterization, not the desired contract: replay currently checks only identity
    // and row count, then acknowledges the changed rowIds without applying changed values.
    expect.soft(replay.status).toBe(200);
    expect
      .soft(replayBody.syncedItems.map((item) => item.rowId))
      .toEqual(changedItems.map((item) => item.rowId));
    expect.soft(persisted.slice(9).map((item) => item.quantity)).toEqual([1000, 1000, 1000]);
    expect
      .soft(persisted.slice(9).map((item) => item.name))
      .toEqual(originalItems.slice(9).map((item) => item.name));
    expect.soft(persistedEstimate?.notes).toBe(original.notes);
  });

  it("documents duplicate inserts when an existing-estimate sync commits but loses its acknowledgement", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 0 });
    const estimate = await seedEstimate(db, { customerId: customer.id });
    const newRows = buildItems(3, product);
    const payload = estimatePayload(customer.id, { items: newRows });

    const committedResponse = await postTxn(app, `/api/estimates/${estimate.id}/sync`, payload);
    expect(committedResponse.status).toBe(200);
    const retryResponse = await postTxn(app, `/api/estimates/${estimate.id}/sync`, payload);

    const persisted = db
      .select()
      .from(estimateItems)
      .where(eq(estimateItems.estimateId, estimate.id))
      .all();

    // This is characterization, not the desired contract: rows without client-assigned item IDs
    // are inserted again when the identical request is retried after an ambiguous outcome.
    expect.soft(retryResponse.status).toBe(200);
    expect.soft(persisted).toHaveLength(6);
    expect.soft(new Set(persisted.map((item) => item.id)).size).toBe(6);
    expect
      .soft(db.select().from(products).where(eq(products.id, product.id)).get())
      .toMatchObject({ totalQuantitySold: 6000 });
  });

  it("rolls back all earlier row writes when the fifteenth row fails ownership validation", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 1000 });
    const owner = await seedEstimate(db, { estimateNo: 1, customerId: customer.id });
    const target = await seedEstimate(db, { estimateNo: 2, customerId: customer.id });
    const foreignItem = await seedEstimateItem(db, {
      estimateId: owner.id,
      productId: product.id,
      quantity: 1000,
      totalPrice: 10_000
    });
    const payload = estimatePayload(customer.id, {
      items: [
        ...buildItems(14, product),
        transactionItem({
          id: foreignItem.id,
          rowId: crypto.randomUUID(),
          productId: product.id,
          name: "Foreign fifteenth row",
          productSnapshot: "Foreign fifteenth row",
          position: 14 * 65_536
        })
      ]
    });

    const response = await postTxn(app, `/api/estimates/${target.id}/sync`, payload);

    expect.soft(response.status).toBe(409);
    expect
      .soft(db.select().from(estimateItems).where(eq(estimateItems.estimateId, target.id)).all())
      .toHaveLength(0);
    expect
      .soft(db.select().from(products).where(eq(products.id, product.id)).get())
      .toMatchObject({ totalQuantitySold: 1000 });
    expect
      .soft(db.select().from(estimateItems).where(eq(estimateItems.id, foreignItem.id)).get())
      .toMatchObject({ estimateId: owner.id, quantity: 1000 });
  });
});
