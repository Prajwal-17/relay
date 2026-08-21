import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SyncResponse, TxnPayloadData } from "../../../../shared/types";
import {
  customerLedger,
  customers,
  estimateItems,
  estimates,
  products,
  saleItems,
  sales
} from "../../../db/schema";
import { estimatesController } from "../../../modules/estimates/estimates.controller";
import { salesController } from "../../../modules/sales/sales.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  estimatePayload,
  postTxn,
  readJson,
  salePayload,
  seedCustomer,
  seedProduct,
  transactionItem,
  type DB
} from "../../helpers";

type BillingType = "sale" | "estimate";
type ReplayPayload = TxnPayloadData & {
  billingId: string;
  creationToken: string;
};

describe("billing create-request replay safety", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([
      { path: "/api/sales", controller: salesController },
      { path: "/api/estimates", controller: estimatesController }
    ]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  function createPayload(
    type: BillingType,
    customerId: string,
    product: typeof products.$inferSelect,
    identity: { billingId: string; creationToken: string; itemId: string; rowId: string }
  ): ReplayPayload {
    const items = [
      transactionItem({
        id: identity.itemId,
        rowId: identity.rowId,
        productId: product.id,
        name: product.name,
        productSnapshot: product.productSnapshot,
        price: 10_000,
        quantity: 1000
      })
    ];
    const base =
      type === "sale"
        ? salePayload(customerId, { addToAccounting: true, items })
        : estimatePayload(customerId, { items });

    return {
      ...base,
      billingId: identity.billingId,
      creationToken: identity.creationToken
    };
  }

  async function postCreate(type: BillingType, payload: ReplayPayload) {
    const response = await postTxn(app, `/api/${type}s/create`, payload);
    return { response, body: await readJson<SyncResponse>(response) };
  }

  it("replays an accounted sale without duplicating identity, rows, inventory, ledger, or balance", async () => {
    const customer = await seedCustomer(db, {
      customerType: "account",
      outstandingBalance: 0
    });
    const product = await seedProduct(db, { price: 10_000, totalQuantitySold: 0 });
    const identity = {
      billingId: crypto.randomUUID(),
      creationToken: crypto.randomUUID(),
      itemId: crypto.randomUUID(),
      rowId: crypto.randomUUID()
    };
    const payload = createPayload("sale", customer.id, product, identity);

    const first = await postCreate("sale", payload);
    const second = await postCreate("sale", payload);

    expect.soft(first.response.status).toBe(200);
    expect.soft(second.response.status).toBe(200);
    expect.soft(second.body.billingId).toBe(first.body.billingId);
    expect.soft(second.body.transactionNo).toBe(first.body.transactionNo);
    expect.soft(db.select().from(sales).all()).toHaveLength(1);
    expect.soft(db.select().from(saleItems).all()).toHaveLength(1);
    expect.soft(db.select().from(saleItems).all()[0]?.id).toBe(identity.itemId);
    expect.soft(db.select().from(customerLedger).all()).toHaveLength(1);
    expect
      .soft(db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold)
      .toBe(1000);
    expect
      .soft(
        db.select().from(customers).where(eq(customers.id, customer.id)).get()?.outstandingBalance
      )
      .toBe(10_000);
  });

  it("replays an estimate without duplicating its identity, rows, or inventory delta", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { price: 10_000, totalQuantitySold: 0 });
    const identity = {
      billingId: crypto.randomUUID(),
      creationToken: crypto.randomUUID(),
      itemId: crypto.randomUUID(),
      rowId: crypto.randomUUID()
    };
    const payload = createPayload("estimate", customer.id, product, identity);

    const first = await postCreate("estimate", payload);
    const second = await postCreate("estimate", payload);

    expect.soft(first.response.status).toBe(200);
    expect.soft(second.response.status).toBe(200);
    expect.soft(second.body.billingId).toBe(first.body.billingId);
    expect.soft(second.body.transactionNo).toBe(first.body.transactionNo);
    expect.soft(db.select().from(estimates).all()).toHaveLength(1);
    expect.soft(db.select().from(estimateItems).all()).toHaveLength(1);
    expect.soft(db.select().from(estimateItems).all()[0]?.id).toBe(identity.itemId);
    expect
      .soft(db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold)
      .toBe(1000);
  });

  it.each([
    ["sale", "billing ID", "different-token"],
    ["sale", "creation token", "different-billing-id"],
    ["estimate", "billing ID", "different-token"],
    ["estimate", "creation token", "different-billing-id"]
  ] as const)(
    "rejects %s create replay when the %s is paired with a different identity",
    async (type, _identityLabel, mismatch) => {
      const customer = await seedCustomer(db, {
        name: `${type}-${mismatch}`,
        customerType: type === "sale" ? "account" : "cash"
      });
      const product = await seedProduct(db, {
        name: `${type}-${mismatch}-product`,
        productSnapshot: `${type}-${mismatch}-product snapshot`
      });
      const identity = {
        billingId: crypto.randomUUID(),
        creationToken: crypto.randomUUID(),
        itemId: crypto.randomUUID(),
        rowId: crypto.randomUUID()
      };
      const initialPayload = createPayload(type, customer.id, product, identity);
      const first = await postCreate(type, initialPayload);
      expect(first.response.status).toBe(200);

      const mismatchedIdentity = {
        ...identity,
        billingId: mismatch === "different-billing-id" ? crypto.randomUUID() : identity.billingId,
        creationToken: mismatch === "different-token" ? crypto.randomUUID() : identity.creationToken
      };
      const replay = await postCreate(
        type,
        createPayload(type, customer.id, product, mismatchedIdentity)
      );

      expect(replay.response.status, JSON.stringify(replay.body)).toBe(409);
    }
  );
});
