import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TRANSACTION_TYPE, type TxnPayloadData } from "../../../../shared/types";
import { customerLedger, customers } from "../../../db/schema";
import { customersController } from "../../../modules/customers/customers.controller";
import { salesController } from "../../../modules/sales/sales.controller";
import {
  dbMock,
  createModuleTestApp,
  createTestDb,
  getJson,
  postTxn,
  requestJson,
  rowId1,
  seedCustomer,
  seedProduct,
  type DB
} from "../../helpers";

async function createAndSyncSale(
  app: ReturnType<typeof createModuleTestApp>,
  db: DB,
  customerId: string,
  overrides: Partial<TxnPayloadData> = {},
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
    addToAccounting: true,
    customerId,
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
    ],
    ...overrides
  };

  const response = await postTxn(app, "/api/sales/create", payload);
  return (await response.json()) as { billingId: string };
}

describe("ledger integration tests", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([
      { path: "/api/customers", controller: customersController },
      { path: "/api/sales", controller: salesController }
    ]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  it("an unpaid sale creates a ledger row and increases outstanding", async () => {
    const customer = await seedCustomer(db);
    await createAndSyncSale(app, db, customer.id);

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
    expect(saleRows[0]?.amountDue).toBe(50000);
  });

  it("a fully paid sale nets to zero outstanding with sale+payment ledger rows", async () => {
    const customer = await seedCustomer(db);
    await createAndSyncSale(app, db, customer.id);
    const payment = await requestJson(app, "POST", `/api/customers/${customer.id}/payments`, {
      amount: 50000,
      mode: "cash"
    });
    expect(payment.status).toBe(201);

    const updated = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    expect(updated?.outstandingBalance).toBe(0);

    const saleRows = db
      .select()
      .from(customerLedger)
      .where(eq(customerLedger.customerId, customer.id))
      .all()
      .filter((r) => r.type === "sale");
    expect(saleRows).toHaveLength(1);
    expect(saleRows[0]?.amountDue).toBe(50000);

    const paymentRows = db
      .select()
      .from(customerLedger)
      .where(eq(customerLedger.customerId, customer.id))
      .all()
      .filter((r) => r.type === "payment");
    expect(paymentRows).toHaveLength(1);
    expect(paymentRows[0]?.amountPaid).toBe(50000);
  });

  it("a partially paid sale shows net outstanding", async () => {
    const customer = await seedCustomer(db);
    await createAndSyncSale(app, db, customer.id);
    const payment = await requestJson(app, "POST", `/api/customers/${customer.id}/payments`, {
      amount: 20000,
      mode: "upi"
    });
    expect(payment.status).toBe(201);

    const updated = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    expect(updated?.outstandingBalance).toBe(30000);
  });

  it("payment, adjustment, summary and paginated list behave correctly", async () => {
    const customer = await seedCustomer(db);
    await createAndSyncSale(app, db, customer.id); // outstanding = 50000

    const paymentRes = await requestJson(app, "POST", `/api/customers/${customer.id}/payments`, {
      amount: 20000,
      mode: "cash"
    });
    expect(paymentRes.status).toBe(201);

    const afterPayment = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    expect(afterPayment?.outstandingBalance).toBe(30000);

    const adjustmentRes = await requestJson(
      app,
      "POST",
      `/api/customers/${customer.id}/adjustments`,
      {
        amount: 5000,
        direction: "paid",
        notes: "round-off"
      }
    );
    expect(adjustmentRes.status).toBe(201);

    const afterAdjustment = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    expect(afterAdjustment?.outstandingBalance).toBe(25000);

    const summaryRes = await getJson(app, `/api/customers/${customer.id}/ledger-summary`);
    expect(summaryRes.status).toBe(200);
    const summary = (await summaryRes.json()) as {
      currentBalance: number;
      totalDue: number;
      totalPaid: number;
      openingBalance: number;
      avgSale: number;
      salesCount: number;
      lastPayment: { amount: number; mode: string } | null;
    };
    // sale amountDue 50000, payment amountPaid 20000, adjustment amountPaid 5000 = 50000 - 25000 = 25000
    expect(summary.totalDue).toBe(50000);
    expect(summary.totalPaid).toBe(25000);
    expect(summary.currentBalance).toBe(25000);
    expect(summary.salesCount).toBe(1);
    expect(summary.avgSale).toBe(50000);
    expect(summary.lastPayment?.amount).toBe(20000);
    expect(summary.lastPayment?.mode).toBe("cash");

    const listRes = await getJson(app, `/api/customers/${customer.id}/ledger?pageNo=1&pageSize=20`);
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as {
      totalCount: number;
      data: { type: string; amountDue: number; amountPaid: number; runningBalance: number }[];
    };
    expect(list.totalCount).toBe(3);
    expect(list.data).toHaveLength(3);

    const types = list.data.map((d) => d.type);
    expect(types).toContain("sale");
    expect(types).toContain("payment");
    expect(types).toContain("adjustment");
  });

  it("rejects adding another opening balance after customer creation", async () => {
    const createResponse = await requestJson(app, "POST", "/api/customers", {
      name: "Opening Balance Customer",
      contact: "9123456789",
      customerType: "cash",
      openingBalance: 10000
    });
    expect(createResponse.status).toBe(201);
    const customer = (await createResponse.json()) as { id: string };

    const updateResponse = await requestJson(app, "POST", `/api/customers/${customer.id}`, {
      openingBalance: 5000
    });
    expect(updateResponse.status).toBe(400);

    const saved = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    expect(saved?.outstandingBalance).toBe(10000);

    const openingRows = db
      .select()
      .from(customerLedger)
      .where(eq(customerLedger.customerId, customer.id))
      .all()
      .filter((row) => row.type === "opening_balance");
    expect(openingRows).toHaveLength(1);
    expect(openingRows[0]?.amountDue).toBe(10000);
  });
});
