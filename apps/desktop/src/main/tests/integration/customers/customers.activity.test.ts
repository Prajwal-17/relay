import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { customerLedger } from "../../../db/schema";
import { customersController } from "../../../modules/customers/customers.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  getJson,
  readJson,
  seedCustomer,
  seedEstimate,
  seedSale,
  type DB
} from "../../helpers";

type CustomerTransactions = {
  nextPageNo: number | null;
  totalCount: number;
  data: Array<{
    type: string;
    transactionNo: number;
    grandTotal: number | null;
    canModify?: boolean;
  }>;
};

describe("customers activity integration", () => {
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

  it("returns empty and populated transaction summaries", async () => {
    const empty = await seedCustomer(db, { name: "Empty Summary" });
    expect(await readJson(await getJson(app, `/api/customers/${empty.id}/summary`))).toEqual({
      salesCount: 0,
      estimatesCount: 0,
      average: 0,
      salesTotal: 0,
      estimatesTotal: 0
    });

    const customer = await seedCustomer(db, { name: "Summary Customer" });
    await seedSale(db, { invoiceNo: 401, customerId: customer.id, grandTotal: 50000 });
    await seedSale(db, { invoiceNo: 402, customerId: customer.id, grandTotal: 70000 });
    await seedEstimate(db, { estimateNo: 501, customerId: customer.id, grandTotal: 30000 });
    await seedEstimate(db, {
      estimateNo: 502,
      customerId: customer.id,
      grandTotal: 90000,
      isDeleted: true
    });

    expect(await readJson(await getJson(app, `/api/customers/${customer.id}/summary`))).toEqual({
      salesCount: 2,
      estimatesCount: 1,
      average: 50000,
      salesTotal: 120000,
      estimatesTotal: 30000
    });
  });

  it("searches, sorts, and paginates customer sales with exact final-page semantics", async () => {
    const customer = await seedCustomer(db, { name: "Sales History" });
    const other = await seedCustomer(db, { name: "Other Sales" });
    await seedSale(db, {
      invoiceNo: 610,
      customerId: customer.id,
      grandTotal: 10000,
      createdAt: "2026-07-01T00:00:00.000Z",
      recordedAt: "2026-07-01T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 611,
      customerId: customer.id,
      grandTotal: 30000,
      createdAt: "2026-07-02T00:00:00.000Z",
      recordedAt: "2026-07-28T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 712,
      customerId: customer.id,
      grandTotal: 20000,
      createdAt: "2026-07-03T00:00:00.000Z",
      recordedAt: "2026-07-28T00:00:00.000Z"
    });
    await seedSale(db, { invoiceNo: 699, customerId: other.id, grandTotal: 99999 });

    const first = await readJson<CustomerTransactions>(
      await getJson(app, `/api/customers/${customer.id}/sales?pageSize=2&sort=amount_desc`)
    );
    expect(first).toMatchObject({ totalCount: 3, nextPageNo: 2 });
    expect(first.data.map((sale) => sale.transactionNo)).toEqual([611, 712]);
    expect(first.data.map((sale) => sale.canModify)).toEqual([true, true]);

    const second = await readJson<CustomerTransactions>(
      await getJson(app, `/api/customers/${customer.id}/sales?pageSize=2&pageNo=2&sort=amount_desc`)
    );
    expect(second.nextPageNo).toBeNull();
    expect(second.data).toEqual([
      expect.objectContaining({ transactionNo: 610, canModify: false })
    ]);

    const searched = await readJson<CustomerTransactions>(
      await getJson(app, `/api/customers/${customer.id}/sales?search=61&sort=date_asc`)
    );
    expect(searched.data.map((sale) => sale.transactionNo)).toEqual([610, 611]);

    const exact = await readJson<CustomerTransactions>(
      await getJson(app, `/api/customers/${customer.id}/sales?pageSize=3`)
    );
    expect(exact).toMatchObject({ totalCount: 3, nextPageNo: null });
  });

  it("searches, sorts, and paginates customer estimates", async () => {
    const customer = await seedCustomer(db, { name: "Estimate History" });
    await seedEstimate(db, {
      estimateNo: 810,
      customerId: customer.id,
      grandTotal: 10000,
      createdAt: "2026-06-01T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 811,
      customerId: customer.id,
      grandTotal: 30000,
      createdAt: "2026-06-02T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 912,
      customerId: customer.id,
      grandTotal: 20000,
      createdAt: "2026-06-03T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 813,
      customerId: customer.id,
      grandTotal: 90000,
      createdAt: "2026-06-04T00:00:00.000Z",
      isDeleted: true
    });

    const first = await readJson<CustomerTransactions>(
      await getJson(app, `/api/customers/${customer.id}/estimates?pageSize=2&sort=amount_asc`)
    );
    expect(first).toMatchObject({ totalCount: 3, nextPageNo: 2 });
    expect(first.data.map((estimate) => estimate.transactionNo)).toEqual([810, 912]);

    const searched = await readJson<CustomerTransactions>(
      await getJson(app, `/api/customers/${customer.id}/estimates?search=81&sort=date_desc`)
    );
    expect(searched.data.map((estimate) => estimate.transactionNo)).toEqual([811, 810]);
  });

  it("returns recent sales and merged activity in newest-first order", async () => {
    const customer = await seedCustomer(db, { name: "Activity Customer" });
    await seedSale(db, {
      invoiceNo: 1001,
      customerId: customer.id,
      grandTotal: 50000,
      createdAt: "2026-05-03T10:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 1101,
      customerId: customer.id,
      grandTotal: 30000,
      createdAt: "2026-05-02T10:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 1102,
      customerId: customer.id,
      grandTotal: 90000,
      createdAt: "2026-05-05T10:00:00.000Z",
      isDeleted: true
    });
    db.insert(customerLedger)
      .values({
        customerId: customer.id,
        type: "payment",
        amountPaid: 10000,
        paymentMode: "upi",
        notes: "advance",
        createdAt: "2026-05-04T10:00:00.000Z"
      })
      .run();

    const recent = await readJson<Array<{ invoiceNo: number; grandTotal: number }>>(
      await getJson(app, `/api/customers/${customer.id}/recent-sales?limit=1`)
    );
    expect(recent).toEqual([expect.objectContaining({ invoiceNo: 1001, grandTotal: 50000 })]);

    const activity = await readJson<Array<{ kind: string; title: string; description: string }>>(
      await getJson(app, `/api/customers/${customer.id}/activity?limit=3`)
    );
    expect(activity.map((event) => event.kind)).toEqual(["payment", "sale", "estimate"]);
    expect(activity[0]).toMatchObject({
      title: "Payment received",
      description: expect.stringContaining("advance")
    });
  });

  it("returns 404 for activity routes on a missing customer", async () => {
    const id = crypto.randomUUID();
    for (const suffix of ["summary", "sales", "estimates", "recent-sales", "activity"]) {
      expect((await getJson(app, `/api/customers/${id}/${suffix}`)).status).toBe(404);
    }
  });

  it.each([
    "sales?pageNo=0",
    "sales?pageSize=0",
    "sales?sort=unknown",
    "estimates?pageSize=101",
    "activity?limit=0",
    "activity?limit=101",
    "recent-sales?limit=bad"
  ])("rejects invalid activity query %s", async (suffix) => {
    const customer = await seedCustomer(db);
    expect((await getJson(app, `/api/customers/${customer.id}/${suffix}`)).status).toBe(400);
  });
});
