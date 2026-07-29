import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { customerLedger, customers } from "../../../db/schema";
import { customersController } from "../../../modules/customers/customers.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  readJson,
  requestJson,
  seedCustomer,
  seedSale,
  type DB
} from "../../helpers";

describe("ledger entries integration", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T10:00:00.000Z"));
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([{ path: "/api/customers", controller: customersController }]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
    vi.useRealTimers();
  });

  it("creates payments, adjustments, and quick sales and recomputes the balance", async () => {
    const customer = await seedCustomer(db, { outstandingBalance: 0 });

    const quickSale = await requestJson(app, "POST", `/api/customers/${customer.id}/quick-sales`, {
      amount: 50000,
      notes: "counter sale"
    });
    const adjustment = await requestJson(app, "POST", `/api/customers/${customer.id}/adjustments`, {
      amount: 5000,
      direction: "due",
      notes: "delivery"
    });
    const payment = await requestJson(app, "POST", `/api/customers/${customer.id}/payments`, {
      amount: 20000,
      mode: "upi",
      notes: "received"
    });

    expect([quickSale.status, adjustment.status, payment.status]).toEqual([201, 201, 201]);
    expect(db.select().from(customerLedger).all()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "quick_sale", amountDue: 50000, notes: "counter sale" }),
        expect.objectContaining({ type: "adjustment", amountDue: 5000, amountPaid: 0 }),
        expect.objectContaining({ type: "payment", amountPaid: 20000, paymentMode: "upi" })
      ])
    );
    expect(
      db.select().from(customers).where(eq(customers.id, customer.id)).get()?.outstandingBalance
    ).toBe(35000);
  });

  it.each([
    ["payment", "payments", { amount: 0, mode: "cash" }],
    ["payment mode", "payments", { amount: 1000, mode: "bank" }],
    ["adjustment", "adjustments", { amount: -1, direction: "due" }],
    ["adjustment direction", "adjustments", { amount: 1000, direction: "credit" }],
    ["quick sale", "quick-sales", { amount: 0 }]
  ])("rejects invalid %s without ledger side effects", async (_label, route, payload) => {
    const customer = await seedCustomer(db);
    const before = db.select().from(customers).where(eq(customers.id, customer.id)).get();

    const response = await requestJson(
      app,
      "POST",
      `/api/customers/${customer.id}/${route}`,
      payload
    );

    expect(response.status).toBe(400);
    expect(db.select().from(customerLedger).all()).toEqual([]);
    expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toEqual(before);
  });

  it("returns 404 for entry creation on a missing customer", async () => {
    const customerId = crypto.randomUUID();
    expect(
      (
        await requestJson(app, "POST", `/api/customers/${customerId}/payments`, {
          amount: 1000,
          mode: "cash"
        })
      ).status
    ).toBe(404);
    expect(
      (
        await requestJson(app, "POST", `/api/customers/${customerId}/adjustments`, {
          amount: 1000,
          direction: "due"
        })
      ).status
    ).toBe(404);
    expect(
      (
        await requestJson(app, "POST", `/api/customers/${customerId}/quick-sales`, {
          amount: 1000
        })
      ).status
    ).toBe(404);
    expect(db.select().from(customerLedger).all()).toEqual([]);
  });

  it("updates editable entries and recomputes the balance", async () => {
    const customer = await seedCustomer(db, { outstandingBalance: 30000 });
    const payment = db
      .insert(customerLedger)
      .values({
        customerId: customer.id,
        type: "payment",
        amountPaid: 20000,
        paymentMode: "cash",
        createdAt: "2026-07-29T09:00:00.000Z"
      })
      .returning()
      .get();
    db.insert(customerLedger)
      .values({
        customerId: customer.id,
        type: "quick_sale",
        amountDue: 50000,
        createdAt: "2026-07-29T08:00:00.000Z"
      })
      .run();

    const response = await requestJson(
      app,
      "PATCH",
      `/api/customers/${customer.id}/ledger/${payment.id}`,
      { amountPaid: 30000, paymentMode: "card", notes: "corrected" }
    );
    const body = await readJson<{ amountPaid: number; paymentMode: string; notes: string }>(
      response
    );

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ amountPaid: 30000, paymentMode: "card", notes: "corrected" });
    expect(
      db.select().from(customers).where(eq(customers.id, customer.id)).get()?.outstandingBalance
    ).toBe(20000);
  });

  it.each([
    ["empty update", "payment", {}, 400],
    ["amount due on payment", "payment", { amountDue: 1000 }, 400],
    ["payment mode on adjustment", "adjustment", { paymentMode: "upi" }, 400],
    ["amount paid on quick sale", "quick_sale", { amountPaid: 1000 }, 400]
  ])("rejects %s without changing the entry", async (_label, type, payload, status) => {
    const customer = await seedCustomer(db);
    const entry = db
      .insert(customerLedger)
      .values({
        customerId: customer.id,
        type,
        amountDue: type === "payment" ? 0 : 5000,
        amountPaid: type === "payment" ? 5000 : 0,
        paymentMode: type === "payment" ? "cash" : null,
        createdAt: "2026-07-29T09:00:00.000Z"
      })
      .returning()
      .get();
    const before = db.select().from(customerLedger).where(eq(customerLedger.id, entry.id)).get();

    const response = await requestJson(
      app,
      "PATCH",
      `/api/customers/${customer.id}/ledger/${entry.id}`,
      payload
    );

    expect(response.status).toBe(status);
    expect(db.select().from(customerLedger).where(eq(customerLedger.id, entry.id)).get()).toEqual(
      before
    );
  });

  it("deletes an editable entry and recomputes the balance", async () => {
    const customer = await seedCustomer(db, { outstandingBalance: 15000 });
    const quickSale = db
      .insert(customerLedger)
      .values({
        customerId: customer.id,
        type: "quick_sale",
        amountDue: 15000,
        createdAt: "2026-07-29T09:00:00.000Z"
      })
      .returning()
      .get();

    const response = await requestJson(
      app,
      "DELETE",
      `/api/customers/${customer.id}/ledger/${quickSale.id}`
    );

    expect(response.status).toBe(204);
    expect(
      db.select().from(customerLedger).where(eq(customerLedger.id, quickSale.id)).get()
    ).toBeUndefined();
    expect(
      db.select().from(customers).where(eq(customers.id, customer.id)).get()?.outstandingBalance
    ).toBe(0);
  });

  it("guards entry ownership, age, sale type, and missing IDs for update and delete", async () => {
    const owner = await seedCustomer(db, { name: "Entry Owner" });
    const other = await seedCustomer(db, { name: "Other Customer" });
    const recent = db
      .insert(customerLedger)
      .values({
        customerId: owner.id,
        type: "quick_sale",
        amountDue: 10000,
        createdAt: "2026-07-29T09:00:00.000Z"
      })
      .returning()
      .get();
    const old = db
      .insert(customerLedger)
      .values({
        customerId: owner.id,
        type: "payment",
        amountPaid: 1000,
        paymentMode: "cash",
        createdAt: "2026-07-20T09:00:00.000Z"
      })
      .returning()
      .get();
    const sale = await seedSale(db, { invoiceNo: 120, customerId: owner.id });
    const saleEntry = db
      .insert(customerLedger)
      .values({ customerId: owner.id, saleId: sale.id, type: "sale", amountDue: 5000 })
      .returning()
      .get();

    expect(
      (
        await requestJson(app, "PATCH", `/api/customers/${other.id}/ledger/${recent.id}`, {
          amountDue: 20000
        })
      ).status
    ).toBe(403);
    expect(
      (
        await requestJson(app, "PATCH", `/api/customers/${owner.id}/ledger/${old.id}`, {
          amountPaid: 2000
        })
      ).status
    ).toBe(409);
    expect(
      (await requestJson(app, "DELETE", `/api/customers/${owner.id}/ledger/${saleEntry.id}`)).status
    ).toBe(400);
    expect(
      (await requestJson(app, "DELETE", `/api/customers/${owner.id}/ledger/${crypto.randomUUID()}`))
        .status
    ).toBe(404);
    expect(db.select().from(customerLedger).all()).toHaveLength(3);
  });
});
