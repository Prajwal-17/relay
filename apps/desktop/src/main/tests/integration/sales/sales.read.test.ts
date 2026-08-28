import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { customerLedger } from "../../../db/schema";
import { salesController } from "../../../modules/sales/sales.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  getJson,
  readJson,
  seedCustomer,
  seedSale,
  seedSaleItem,
  type DB
} from "../../helpers";

type SaleList = {
  nextPageNo: number | null;
  totalRevenue: number;
  totalTransactions: number;
  transactions: Array<{
    id: string;
    transactionNo: number;
    customerName: string;
    grandTotal: number | null;
    isAddedToAccounting: boolean;
  }>;
};

describe("sales read integration", () => {
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
    app = createModuleTestApp([{ path: "/api/sales", controller: salesController }]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
    vi.useRealTimers();
  });

  it("returns the next invoice number", async () => {
    expect(await readJson(await getJson(app, "/api/sales/next-number"))).toEqual({ nextNo: 1 });
    const customer = await seedCustomer(db);
    await seedSale(db, { invoiceNo: 8, customerId: customer.id });
    await seedSale(db, { invoiceNo: 3, customerId: customer.id });

    expect(await readJson(await getJson(app, "/api/sales/next-number"))).toEqual({ nextNo: 9 });
  });

  it("returns a sale with ordered items, customer data, and accounting metadata", async () => {
    const customer = await seedCustomer(db, { name: "Read Customer" });
    const sale = await seedSale(db, {
      invoiceNo: 10,
      customerId: customer.id,
      grandTotal: 30000,
      totalQuantity: 3000,
      recordedAt: "2026-07-28T10:00:00.000Z"
    });
    const second = await seedSaleItem(db, {
      saleId: sale.id,
      productId: null,
      name: "Second",
      position: 2,
      quantity: 2000,
      checkedQty: null,
      totalPrice: 20000
    });
    const first = await seedSaleItem(db, {
      saleId: sale.id,
      productId: null,
      name: "First",
      position: 1,
      quantity: 1000,
      checkedQty: 1000,
      totalPrice: 10000
    });
    db.insert(customerLedger)
      .values({ customerId: customer.id, saleId: sale.id, type: "sale", amountDue: 30000 })
      .run();

    const response = await getJson(app, `/api/sales/${sale.id}`);
    const body = await readJson<{
      transactionNo: number;
      customer: { name: string };
      isAddedToAccounting: boolean;
      canModify: boolean;
      items: Array<{ id: string; checkedQty: number }>;
    }>(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      transactionNo: 10,
      customer: { name: "Read Customer" },
      isAddedToAccounting: true,
      canModify: true
    });
    expect(body.items.map((item) => item.id)).toEqual([first.id, second.id]);
    expect(body.items[1]?.checkedQty).toBe(0);
  });

  it("rejects invalid and missing sale IDs", async () => {
    expect((await getJson(app, "/api/sales/not-a-uuid")).status).toBe(400);
    expect((await getJson(app, `/api/sales/${crypto.randomUUID()}`)).status).toBe(400);
  });

  it("filters inclusively, sorts, summarizes, and paginates with the requested page size", async () => {
    const customer = await seedCustomer(db, { name: "List Customer" });
    const rows = [
      { invoiceNo: 21, grandTotal: 10000, createdAt: "2026-07-01T00:00:00.000Z" },
      { invoiceNo: 22, grandTotal: 30000, createdAt: "2026-07-02T00:00:00.000Z" },
      { invoiceNo: 23, grandTotal: 20000, createdAt: "2026-07-03T00:00:00.000Z" }
    ];
    for (const row of rows) await seedSale(db, { ...row, customerId: customer.id });

    const base = "/api/sales?from=2026-07-01T00:00:00.000Z&to=2026-07-03T00:00:00.000Z&pageSize=2";
    const firstPage = await readJson<SaleList>(await getJson(app, `${base}&sortBy=high_to_low`));
    expect(firstPage).toMatchObject({
      totalRevenue: 60000,
      totalTransactions: 3,
      nextPageNo: 2
    });
    expect(firstPage.transactions.map((sale) => sale.transactionNo)).toEqual([22, 23]);

    const secondPage = await readJson<SaleList>(
      await getJson(app, `${base}&sortBy=high_to_low&pageNo=2`)
    );
    expect(secondPage.nextPageNo).toBeNull();
    expect(secondPage.transactions.map((sale) => sale.transactionNo)).toEqual([21]);

    const exactFinalPage = await readJson<SaleList>(
      await getJson(
        app,
        "/api/sales?from=2026-07-01T00:00:00.000Z&to=2026-07-02T00:00:00.000Z&pageSize=2"
      )
    );
    expect(exactFinalPage).toMatchObject({ totalTransactions: 2, nextPageNo: null });
  });

  it.each([
    ["date_oldest_first", [21, 22, 23]],
    ["date_newest_first", [23, 22, 21]],
    ["low_to_high", [21, 23, 22]],
    ["high_to_low", [22, 23, 21]]
  ])("supports %s list ordering", async (sortBy, expected) => {
    const customer = await seedCustomer(db, { name: "Sort Customer" });
    await seedSale(db, {
      invoiceNo: 21,
      customerId: customer.id,
      grandTotal: 10000,
      createdAt: "2026-07-01T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 22,
      customerId: customer.id,
      grandTotal: 30000,
      createdAt: "2026-07-02T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 23,
      customerId: customer.id,
      grandTotal: 20000,
      createdAt: "2026-07-03T00:00:00.000Z"
    });

    const body = await readJson<SaleList>(
      await getJson(
        app,
        `/api/sales?from=2026-07-01T00:00:00.000Z&to=2026-07-03T00:00:00.000Z&sortBy=${sortBy}`
      )
    );
    expect(body.transactions.map((sale) => sale.transactionNo)).toEqual(expected);
  });

  it("filters by a trimmed, case-insensitive customer substring within the date range", async () => {
    const matchingCustomer = await seedCustomer(db, { name: "Northwind Retail Counter" });
    const otherCustomer = await seedCustomer(db, { name: "Southwind Wholesale" });
    await seedSale(db, {
      invoiceNo: 201,
      customerId: matchingCustomer.id,
      grandTotal: 10000,
      createdAt: "2026-07-01T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 202,
      customerId: matchingCustomer.id,
      grandTotal: 20000,
      createdAt: "2026-07-03T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 203,
      customerId: matchingCustomer.id,
      grandTotal: 40000,
      createdAt: "2026-06-30T23:59:59.999Z"
    });
    await seedSale(db, {
      invoiceNo: 204,
      customerId: otherCustomer.id,
      grandTotal: 30000,
      createdAt: "2026-07-02T00:00:00.000Z"
    });

    const body = await readJson<SaleList>(
      await getJson(
        app,
        `/api/sales?search=${encodeURIComponent(" ReTaIl ")}&from=2026-07-01T00:00:00.000Z&to=2026-07-03T23:59:59.999Z&sortBy=high_to_low`
      )
    );

    expect(body).toMatchObject({ totalRevenue: 30000, totalTransactions: 2, nextPageNo: null });
    expect(body.transactions.map((sale) => sale.transactionNo)).toEqual([202, 201]);
  });

  it.each([
    ["205", [205], 10000],
    ["#206", [206], 20000],
    ["05", [], 0]
  ])("matches exact invoice search %s", async (search, expected, totalRevenue) => {
    const customer = await seedCustomer(db, { name: "Document Search Customer" });
    await seedSale(db, {
      invoiceNo: 205,
      customerId: customer.id,
      grandTotal: 10000,
      createdAt: "2026-07-01T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 206,
      customerId: customer.id,
      grandTotal: 20000,
      createdAt: "2026-07-02T00:00:00.000Z"
    });

    const body = await readJson<SaleList>(
      await getJson(
        app,
        `/api/sales?search=${encodeURIComponent(search)}&from=2026-07-01T00:00:00.000Z&to=2026-07-03T00:00:00.000Z`
      )
    );

    expect(body.transactions.map((sale) => sale.transactionNo)).toEqual(expected);
    expect(body).toMatchObject({
      totalRevenue,
      totalTransactions: expected.length,
      nextPageNo: null
    });
  });

  it.each([
    ["date_oldest_first", [211, 212, 213]],
    ["date_newest_first", [213, 212, 211]],
    ["low_to_high", [211, 213, 212]],
    ["high_to_low", [212, 213, 211]]
  ])("sorts searched sales with %s", async (sortBy, expected) => {
    const customer = await seedCustomer(db, { name: "Matched Orders" });
    await seedSale(db, {
      invoiceNo: 211,
      customerId: customer.id,
      grandTotal: 10000,
      createdAt: "2026-07-01T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 212,
      customerId: customer.id,
      grandTotal: 30000,
      createdAt: "2026-07-02T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 213,
      customerId: customer.id,
      grandTotal: 20000,
      createdAt: "2026-07-03T00:00:00.000Z"
    });

    const body = await readJson<SaleList>(
      await getJson(
        app,
        `/api/sales?search=matched&from=2026-07-01T00:00:00.000Z&to=2026-07-03T00:00:00.000Z&sortBy=${sortBy}`
      )
    );
    expect(body.transactions.map((sale) => sale.transactionNo)).toEqual(expected);
  });

  it("paginates and summarizes all filtered sales", async () => {
    const first = await seedCustomer(db, { name: "Wholesale Alpha" });
    const second = await seedCustomer(db, { name: "Wholesale Beta" });
    const third = await seedCustomer(db, { name: "Wholesale Gamma" });
    const excluded = await seedCustomer(db, { name: "Retail Delta" });
    await seedSale(db, {
      invoiceNo: 221,
      customerId: first.id,
      grandTotal: 10000,
      createdAt: "2026-07-01T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 222,
      customerId: second.id,
      grandTotal: 20000,
      createdAt: "2026-07-02T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 223,
      customerId: third.id,
      grandTotal: 30000,
      createdAt: "2026-07-03T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 224,
      customerId: excluded.id,
      grandTotal: 40000,
      createdAt: "2026-07-04T00:00:00.000Z"
    });

    const base =
      "/api/sales?search=wholesale&from=2026-07-01T00:00:00.000Z&to=2026-07-04T00:00:00.000Z&sortBy=date_oldest_first&pageSize=2";
    const firstPage = await readJson<SaleList>(await getJson(app, base));
    expect(firstPage).toMatchObject({ totalRevenue: 60000, totalTransactions: 3, nextPageNo: 2 });
    expect(firstPage.transactions.map((sale) => sale.transactionNo)).toEqual([221, 222]);

    const secondPage = await readJson<SaleList>(await getJson(app, `${base}&pageNo=2`));
    expect(secondPage).toMatchObject({
      totalRevenue: 60000,
      totalTransactions: 3,
      nextPageNo: null
    });
    expect(secondPage.transactions.map((sale) => sale.transactionNo)).toEqual([223]);
  });

  it("treats percent and underscore search characters literally", async () => {
    const percent = await seedCustomer(db, { name: "Percent % Market" });
    const percentWildcard = await seedCustomer(db, { name: "Percent X Market" });
    const underscore = await seedCustomer(db, { name: "Under_score Market" });
    const underscoreWildcard = await seedCustomer(db, { name: "UnderXscore Market" });
    await seedSale(db, {
      invoiceNo: 231,
      customerId: percent.id,
      grandTotal: 10000,
      createdAt: "2026-07-01T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 232,
      customerId: percentWildcard.id,
      grandTotal: 20000,
      createdAt: "2026-07-01T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 233,
      customerId: underscore.id,
      grandTotal: 30000,
      createdAt: "2026-07-01T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 234,
      customerId: underscoreWildcard.id,
      grandTotal: 40000,
      createdAt: "2026-07-01T00:00:00.000Z"
    });
    const range = "&from=2026-07-01T00:00:00.000Z&to=2026-07-01T23:59:59.999Z";

    const percentBody = await readJson<SaleList>(
      await getJson(app, `/api/sales?search=${encodeURIComponent("%")}${range}`)
    );
    const underscoreBody = await readJson<SaleList>(
      await getJson(app, `/api/sales?search=${encodeURIComponent("_")}${range}`)
    );

    expect(percentBody.transactions.map((sale) => sale.transactionNo)).toEqual([231]);
    expect(percentBody).toMatchObject({ totalRevenue: 10000, totalTransactions: 1 });
    expect(underscoreBody.transactions.map((sale) => sale.transactionNo)).toEqual([233]);
    expect(underscoreBody).toMatchObject({ totalRevenue: 30000, totalTransactions: 1 });
  });
  it("returns an empty summary when the date range has no sales", async () => {
    const body = await readJson<SaleList>(
      await getJson(app, "/api/sales?from=2025-01-01T00:00:00.000Z&to=2025-01-02T00:00:00.000Z")
    );
    expect(body).toEqual({
      nextPageNo: null,
      totalRevenue: 0,
      totalTransactions: 0,
      transactions: []
    });
  });

  it.each([
    "/api/sales?pageNo=0",
    "/api/sales?pageSize=0",
    "/api/sales?pageSize=101",
    "/api/sales?sortBy=unknown",
    "/api/sales?from=not-a-date",
    "/api/sales?to=not-a-date",
    `/api/sales?search=${"a".repeat(101)}`
  ])("rejects invalid list query %s", async (pathname) => {
    expect((await getJson(app, pathname)).status).toBe(400);
  });
});
