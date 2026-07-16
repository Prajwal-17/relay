import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { TRANSACTION_TYPE, type TxnPayloadData } from "../../shared/types";
import { customerLedger, customers } from "../db/schema";
import { customersController } from "../modules/customers/customers.controller";
import { salesController } from "../modules/sales/sales.controller";
import { AppError } from "../utils/appError";
import {
  cleanupDb,
  createTestDb,
  postTxn,
  rowId1,
  seedCustomer,
  seedProduct,
  type DB
} from "./helpers";

// ----------------
// Compile better-sqlite3 `pnpm run rebuild:node` before running this test
// ----------------

const mocks = vi.hoisted(() => {
  return {
    db: {
      instance: null as DB | null
    }
  };
});

vi.mock("../db/db", () => {
  return {
    get db() {
      return mocks.db.instance;
    }
  };
});

function createLedgerTestApp() {
  const app = new Hono();

  app.onError((err, c) => {
    if (err instanceof AppError) {
      return c.json({ error: { message: err.message } }, err.statusCode as 400 | 404 | 500);
    }
    return c.json({ error: { message: err.message } }, 500);
  });

  app.route("/api/customers", customersController);
  app.route("/api/sales", salesController);

  return app;
}

async function postJson(app: Hono, pathname: string, payload: unknown) {
  return app.request(pathname, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function getJson(app: Hono, pathname: string) {
  return app.request(pathname, { method: "GET" });
}

async function createSimpleSale(
  app: Hono,
  db: DB,
  customerId: string,
  isPaid: boolean,
  price = 10000,
  quantity = 5000
) {
  const product = await seedProduct(db, {
    name: "Ledger Test Product",
    productSnapshot: "Ledger Test Product",
    price,
    mrp: price,
    purchasePrice: 0,
    weight: "1",
    unit: "pc"
  });

  const payload: TxnPayloadData = {
    transactionNo: undefined,
    transactionType: TRANSACTION_TYPE.SALE,
    customerId,
    isPaid,
    notes: null,
    items: [
      {
        id: null,
        rowId: rowId1,
        productId: product.id,
        name: product.name,
        productSnapshot: product.productSnapshot,
        mrp: product.mrp,
        price: product.price,
        weight: product.weight,
        unit: product.unit,
        quantity,
        checkedQty: 0,
        position: 0,
        isDeleted: false
      }
    ]
  };

  return postTxn(app, "/api/sales/create", payload);
}

describe.skip("ledger integration tests", () => {
  let app: ReturnType<typeof createLedgerTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    mocks.db.instance = db;
    app = createLedgerTestApp();
  });

  afterEach(() => {
    if (db) {
      cleanupDb(db);
    }
    sqlite?.close();
  });

  it("creating a customer with an opening balance inserts a ledger row and sets outstanding", async () => {
    const response = await postJson(app, "/api/customers", {
      name: "Acct Customer",
      contact: "9876543210",
      customerType: "account",
      openingBalance: 50000
    });

    expect(response.status).toBe(201);
    const created = (await response.json()) as { id: string };

    const customer = db.select().from(customers).where(eq(customers.id, created.id)).get();
    expect(customer?.outstandingBalance).toBe(50000);

    const openingRow = db
      .select()
      .from(customerLedger)
      .where(eq(customerLedger.customerId, created.id))
      .get();
    expect(openingRow?.type).toBe("opening_balance");
    expect(openingRow?.debit).toBe(50000);
  });

  it("an unpaid sale creates a debit ledger row and increases outstanding", async () => {
    const customer = await seedCustomer(db);
    await createSimpleSale(app, db, customer.id, false);

    const updated = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    // grandTotal = price * quantity / 1000 = 10000 * 5000 / 1000 = 50000
    expect(updated?.outstandingBalance).toBe(50000);

    const saleRows = db
      .select()
      .from(customerLedger)
      .where(eq(customerLedger.customerId, customer.id))
      .all()
      .filter((r) => r.type === "sale");
    expect(saleRows).toHaveLength(1);
    expect(saleRows[0]?.debit).toBe(50000);
  });

  it("a paid sale is excluded from outstanding but present in the ledger", async () => {
    const customer = await seedCustomer(db);
    await createSimpleSale(app, db, customer.id, true);

    const updated = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    expect(updated?.outstandingBalance).toBe(0);

    const saleRows = db
      .select()
      .from(customerLedger)
      .where(eq(customerLedger.customerId, customer.id))
      .all()
      .filter((r) => r.type === "sale");
    expect(saleRows).toHaveLength(1);
    expect(saleRows[0]?.debit).toBe(50000);
  });

  it("payment, adjustment, summary and paginated list behave correctly", async () => {
    const customer = await seedCustomer(db);
    await createSimpleSale(app, db, customer.id, false); // outstanding = 50000

    const paymentRes = await postJson(app, `/api/customers/${customer.id}/payments`, {
      amount: 20000,
      mode: "cash"
    });
    expect(paymentRes.status).toBe(201);

    const afterPayment = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    expect(afterPayment?.outstandingBalance).toBe(30000);

    const adjustmentRes = await postJson(app, `/api/customers/${customer.id}/adjustments`, {
      amount: 5000,
      direction: "credit",
      notes: "round-off"
    });
    expect(adjustmentRes.status).toBe(201);

    const afterAdjustment = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    expect(afterAdjustment?.outstandingBalance).toBe(25000);

    const summaryRes = await getJson(app, `/api/customers/${customer.id}/ledger-summary`);
    expect(summaryRes.status).toBe(200);
    const summary = (await summaryRes.json()) as {
      currentBalance: number;
      totalDebit: number;
      totalCredit: number;
      openingBalance: number;
      avgSale: number;
      salesCount: number;
      lastPayment: { amount: number; mode: string } | null;
    };
    // currentBalance is the pure ledger sum: 50000 debit - 20000 - 5000 credit = 25000
    expect(summary.totalDebit).toBe(50000);
    expect(summary.totalCredit).toBe(25000);
    expect(summary.currentBalance).toBe(25000);
    expect(summary.salesCount).toBe(1);
    expect(summary.avgSale).toBe(50000);
    expect(summary.lastPayment?.amount).toBe(20000);
    expect(summary.lastPayment?.mode).toBe("cash");

    const listRes = await getJson(app, `/api/customers/${customer.id}/ledger?pageNo=1&pageSize=20`);
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as {
      totalCount: number;
      data: { type: string; debit: number; credit: number; runningBalance: number }[];
    };
    expect(list.totalCount).toBe(3);
    expect(list.data).toHaveLength(3);

    const types = list.data.map((d) => d.type);
    expect(types).toContain("sale");
    expect(types).toContain("payment");
    expect(types).toContain("adjustment");
  });

  it("creating an opening balance twice is rejected", async () => {
    const customer = await seedCustomer(db);

    const first = await postJson(app, `/api/customers/${customer.id}/opening-balance`, {
      amount: 10000
    });
    expect(first.status).toBe(201);

    const second = await postJson(app, `/api/customers/${customer.id}/opening-balance`, {
      amount: 5000
    });
    expect(second.status).toBe(400);
  });
});
