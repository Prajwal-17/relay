import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CustomerRole } from "../../../db/enum";
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
  seedEstimate,
  seedProduct,
  seedSale,
  type DB
} from "../../helpers";

type CustomerList = {
  nextPageNo: number | null;
  totalCount: number;
  data: Array<{ id: string; name: string; customerType: string; isArchived: boolean }>;
};

describe("customers integration", () => {
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

  it("rejects invalid and duplicate customers without extra rows", async () => {
    const invalid = await requestJson(app, "POST", "/api/customers", {
      name: "A",
      contact: "bad",
      customerType: "cash"
    });
    expect(invalid.status).toBe(400);
    expect(db.select().from(customers).all()).toEqual([]);

    await seedCustomer(db, { name: "Duplicate Name" });
    const duplicate = await requestJson(app, "POST", "/api/customers", {
      name: "Duplicate Name",
      contact: null,
      customerType: "cash"
    });
    expect(duplicate.status).toBe(400);
    expect(db.select().from(customers).all()).toHaveLength(1);
  });

  it("filters, searches, sorts, paginates, and optionally includes archived customers", async () => {
    await seedCustomer(db, {
      name: "Bravo Account",
      customerType: CustomerRole.ACCOUNT,
      createdAt: "2026-01-02T00:00:00.000Z"
    });
    await seedCustomer(db, {
      name: "Alpha Cash",
      customerType: CustomerRole.CASH,
      createdAt: "2026-01-01T00:00:00.000Z"
    });
    await seedCustomer(db, {
      name: "Archived Account",
      customerType: CustomerRole.ACCOUNT,
      isArchived: true,
      archivedAt: "2026-01-03T00:00:00.000Z"
    });

    const active = await getJson(app, "/api/customers?pageSize=1&sort=name_asc");
    const activeBody = await readJson<CustomerList>(active);
    expect(activeBody).toMatchObject({ totalCount: 2, nextPageNo: 2 });
    expect(activeBody.data.map((customer) => customer.name)).toEqual(["Alpha Cash"]);

    const filtered = await getJson(
      app,
      "/api/customers?query=Br&type=account&includeArchived=false"
    );
    expect((await readJson<CustomerList>(filtered)).data.map((customer) => customer.name)).toEqual([
      "Bravo Account"
    ]);

    const archived = await getJson(
      app,
      "/api/customers?type=account&includeArchived=true&sort=name_asc"
    );
    expect((await readJson<CustomerList>(archived)).data.map((customer) => customer.name)).toEqual([
      "Archived Account",
      "Bravo Account"
    ]);
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

  it("archives, restores, and deletes an unlinked customer", async () => {
    const customer = await seedCustomer(db, { name: "Lifecycle Customer" });

    const archived = await requestJson(app, "PATCH", `/api/customers/${customer.id}/archive`);
    expect(archived.status).toBe(200);
    expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toMatchObject({
      isArchived: true,
      archivedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
    });

    const hidden = await getJson(app, "/api/customers");
    expect((await readJson<CustomerList>(hidden)).data).toEqual([]);

    const restored = await requestJson(app, "PATCH", `/api/customers/${customer.id}/restore`);
    expect(restored.status).toBe(200);

    const deleted = await requestJson(app, "DELETE", `/api/customers/${customer.id}`);
    expect(deleted.status).toBe(204);
    expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toBeUndefined();
  });

  it("protects the default customer and customers linked to transactions", async () => {
    const defaultCustomer = await seedCustomer(db, { name: "DEFAULT" });
    const rename = await requestJson(app, "POST", `/api/customers/${defaultCustomer.id}`, {
      name: "Walk In"
    });
    expect(rename.status).toBe(400);
    expect((await getJson(app, "/api/customers/default")).status).toBe(200);
    expect(
      (await requestJson(app, "PATCH", `/api/customers/${defaultCustomer.id}/archive`)).status
    ).toBe(400);
    expect((await requestJson(app, "DELETE", `/api/customers/${defaultCustomer.id}`)).status).toBe(
      400
    );

    const linked = await seedCustomer(db, { name: "Linked Customer" });
    await seedSale(db, { invoiceNo: 301, customerId: linked.id });
    const before = db.select().from(customers).where(eq(customers.id, linked.id)).get();
    const response = await requestJson(app, "DELETE", `/api/customers/${linked.id}`);
    expect(response.status).toBe(400);
    expect(db.select().from(customers).where(eq(customers.id, linked.id)).get()).toEqual(before);
  });

  it("returns customer summaries, transaction lists, recent sales, and merged activity", async () => {
    const customer = await seedCustomer(db, { name: "History Customer" });
    await seedProduct(db);
    await seedSale(db, {
      invoiceNo: 401,
      customerId: customer.id,
      grandTotal: 50000,
      totalQuantity: 2000,
      createdAt: "2026-05-03T10:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 501,
      customerId: customer.id,
      grandTotal: 30000,
      totalQuantity: 1000,
      createdAt: "2026-05-02T10:00:00.000Z"
    });
    db.insert(customerLedger)
      .values({
        customerId: customer.id,
        type: "payment",
        amountPaid: 10000,
        paymentMode: "upi",
        createdAt: "2026-05-04T10:00:00.000Z"
      })
      .run();

    const summary = await getJson(app, `/api/customers/${customer.id}/summary`);
    expect(await readJson<Record<string, number>>(summary)).toEqual({
      salesCount: 1,
      estimatesCount: 1,
      average: 40000,
      salesTotal: 50000,
      estimatesTotal: 30000
    });

    const salesResponse = await getJson(app, `/api/customers/${customer.id}/sales`);
    expect(
      (await readJson<{ data: Array<{ transactionNo: number }> }>(salesResponse)).data
    ).toEqual([expect.objectContaining({ transactionNo: 401 })]);
    const estimatesResponse = await getJson(app, `/api/customers/${customer.id}/estimates`);
    expect(
      (await readJson<{ data: Array<{ transactionNo: number }> }>(estimatesResponse)).data
    ).toEqual([expect.objectContaining({ transactionNo: 501 })]);

    const recent = await getJson(app, `/api/customers/${customer.id}/recent-sales?limit=1`);
    expect((await readJson<Array<{ invoiceNo: number }>>(recent))[0]?.invoiceNo).toBe(401);

    const activity = await getJson(app, `/api/customers/${customer.id}/activity?limit=3`);
    expect((await readJson<Array<{ kind: string }>>(activity)).map((event) => event.kind)).toEqual([
      "payment",
      "sale",
      "estimate"
    ]);
  });
});
