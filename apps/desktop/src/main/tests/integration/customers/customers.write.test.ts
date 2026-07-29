import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { customerLedger, customers } from "../../../db/schema";
import { customersController } from "../../../modules/customers/customers.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  getJson,
  readJson,
  requestJson,
  seedCustomer,
  type DB
} from "../../helpers";

describe("customers write integration", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([{ path: "/api/customers", controller: customersController }]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  it("creates a customer and opening balance atomically", async () => {
    const response = await requestJson(app, "POST", "/api/customers", {
      name: "Anita Stores",
      contact: "9876543210",
      customerType: "account",
      address: "Market Road",
      openingBalance: 25000
    });
    const created = await readJson<{ id: string; outstandingBalance: number }>(response);

    expect(response.status).toBe(201);
    expect(created.outstandingBalance).toBe(25000);
    expect(db.select().from(customers).where(eq(customers.id, created.id)).get()).toMatchObject({
      name: "Anita Stores",
      customerType: "account",
      outstandingBalance: 25000
    });
    expect(
      db.select().from(customerLedger).where(eq(customerLedger.customerId, created.id)).get()
    ).toMatchObject({ type: "opening_balance", amountDue: 25000, amountPaid: 0 });
  });

  it("rejects duplicate names without creating another customer", async () => {
    await seedCustomer(db, { name: "Duplicate Name" });
    const duplicate = await requestJson(app, "POST", "/api/customers", {
      name: "Duplicate Name",
      contact: null,
      customerType: "cash"
    });
    expect(duplicate.status).toBe(400);
    expect(db.select().from(customers).all()).toHaveLength(1);
  });

  it("retrieves and partially updates a customer while handling invalid IDs", async () => {
    const customer = await seedCustomer(db, { name: "Original Customer", address: "Old" });

    const getResponse = await getJson(app, `/api/customers/${customer.id}`);
    expect(getResponse.status).toBe(200);

    const update = await requestJson(app, "POST", `/api/customers/${customer.id}`, {
      name: "Updated Customer",
      address: "New Address"
    });
    expect(update.status).toBe(200);
    expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toMatchObject({
      name: "Updated Customer",
      address: "New Address",
      contact: "9876543210"
    });

    const invalid = await getJson(app, "/api/customers/not-a-uuid");
    expect(invalid.status).toBe(400);
    const missing = await getJson(app, `/api/customers/${crypto.randomUUID()}`);
    expect(missing.status).toBe(404);
  });

  it.each([
    ["short name", { name: "A", contact: null, customerType: "cash" }],
    ["invalid contact", { name: "Valid Name", contact: "bad", customerType: "cash" }],
    ["invalid type", { name: "Valid Name", contact: null, customerType: "vendor" }],
    [
      "negative opening balance",
      { name: "Valid Name", contact: null, customerType: "cash", openingBalance: -1 }
    ],
    [
      "unknown field",
      { name: "Valid Name", contact: null, customerType: "cash", creditLimit: 1000 }
    ]
  ])("rejects %s without creating customer or ledger rows", async (_label, payload) => {
    const response = await requestJson(app, "POST", "/api/customers", payload);
    expect(response.status).toBe(400);
    expect(db.select().from(customers).all()).toEqual([]);
    expect(db.select().from(customerLedger).all()).toEqual([]);
  });

  it("rejects missing and invalid updates without side effects", async () => {
    const customer = await seedCustomer(db, { name: "Stable Customer" });
    const before = db.select().from(customers).where(eq(customers.id, customer.id)).get();

    expect(
      (
        await requestJson(app, "POST", `/api/customers/${crypto.randomUUID()}`, {
          name: "Missing Customer"
        })
      ).status
    ).toBe(404);
    expect(
      (
        await requestJson(app, "POST", `/api/customers/${customer.id}`, {
          contact: "invalid"
        })
      ).status
    ).toBe(400);
    expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toEqual(before);
  });
});
