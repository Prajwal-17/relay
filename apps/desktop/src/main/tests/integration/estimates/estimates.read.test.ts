import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { estimatesController } from "../../../modules/estimates/estimates.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  getJson,
  readJson,
  seedCustomer,
  seedEstimate,
  seedEstimateItem,
  type DB
} from "../../helpers";

type EstimateList = {
  nextPageNo: number | null;
  totalRevenue: number;
  totalTransactions: number;
  transactions: Array<{
    id: string;
    transactionNo: number;
    customerName: string;
    grandTotal: number | null;
  }>;
};

describe("estimates read integration", () => {
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

  it("returns the next estimate number", async () => {
    expect(await readJson(await getJson(app, "/api/estimates/next-number"))).toEqual({ nextNo: 1 });
    const customer = await seedCustomer(db);
    await seedEstimate(db, { estimateNo: 12, customerId: customer.id });
    await seedEstimate(db, { estimateNo: 4, customerId: customer.id });

    expect(await readJson(await getJson(app, "/api/estimates/next-number"))).toEqual({
      nextNo: 13
    });
  });

  it("returns an estimate with ordered items and customer data", async () => {
    const customer = await seedCustomer(db, { name: "Estimate Reader" });
    const estimate = await seedEstimate(db, {
      estimateNo: 20,
      customerId: customer.id,
      grandTotal: 30000,
      totalQuantity: 3000
    });
    const second = await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: null,
      name: "Second",
      position: 2,
      checkedQty: null
    });
    const first = await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: null,
      name: "First",
      position: 1,
      checkedQty: 1000
    });

    const response = await getJson(app, `/api/estimates/${estimate.id}`);
    const body = await readJson<{
      transactionNo: number;
      customer: { name: string };
      items: Array<{ id: string; checkedQty: number }>;
    }>(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ transactionNo: 20, customer: { name: "Estimate Reader" } });
    expect(body.items.map((item) => item.id)).toEqual([first.id, second.id]);
    expect(body.items[1]?.checkedQty).toBe(0);
  });

  it("rejects invalid and missing estimate IDs", async () => {
    expect((await getJson(app, "/api/estimates/not-a-uuid")).status).toBe(400);
    expect((await getJson(app, `/api/estimates/${crypto.randomUUID()}`)).status).toBe(400);
  });

  it("filters inclusively, summarizes, and paginates using the requested page size", async () => {
    const customer = await seedCustomer(db, { name: "Estimate List" });
    const rows = [
      { estimateNo: 31, grandTotal: 10000, createdAt: "2026-06-01T00:00:00.000Z" },
      { estimateNo: 32, grandTotal: 30000, createdAt: "2026-06-02T00:00:00.000Z" },
      { estimateNo: 33, grandTotal: 20000, createdAt: "2026-06-03T00:00:00.000Z" }
    ];
    for (const row of rows) await seedEstimate(db, { ...row, customerId: customer.id });

    const base =
      "/api/estimates?from=2026-06-01T00:00:00.000Z&to=2026-06-03T00:00:00.000Z&pageSize=2&sortBy=high_to_low";
    const firstPage = await readJson<EstimateList>(await getJson(app, base));
    expect(firstPage).toMatchObject({
      totalRevenue: 60000,
      totalTransactions: 3,
      nextPageNo: 2
    });
    expect(firstPage.transactions.map((estimate) => estimate.transactionNo)).toEqual([32, 33]);

    const secondPage = await readJson<EstimateList>(await getJson(app, `${base}&pageNo=2`));
    expect(secondPage.nextPageNo).toBeNull();
    expect(secondPage.transactions.map((estimate) => estimate.transactionNo)).toEqual([31]);

    const exactFinalPage = await readJson<EstimateList>(
      await getJson(
        app,
        "/api/estimates?from=2026-06-01T00:00:00.000Z&to=2026-06-02T00:00:00.000Z&pageSize=2"
      )
    );
    expect(exactFinalPage).toMatchObject({ totalTransactions: 2, nextPageNo: null });
  });

  it.each([
    ["date_oldest_first", [31, 32, 33]],
    ["date_newest_first", [33, 32, 31]],
    ["low_to_high", [31, 33, 32]],
    ["high_to_low", [32, 33, 31]]
  ])("supports %s list ordering", async (sortBy, expected) => {
    const customer = await seedCustomer(db, { name: "Estimate Sort" });
    await seedEstimate(db, {
      estimateNo: 31,
      customerId: customer.id,
      grandTotal: 10000,
      createdAt: "2026-06-01T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 32,
      customerId: customer.id,
      grandTotal: 30000,
      createdAt: "2026-06-02T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 33,
      customerId: customer.id,
      grandTotal: 20000,
      createdAt: "2026-06-03T00:00:00.000Z"
    });
    const body = await readJson<EstimateList>(
      await getJson(
        app,
        `/api/estimates?from=2026-06-01T00:00:00.000Z&to=2026-06-03T00:00:00.000Z&sortBy=${sortBy}`
      )
    );
    expect(body.transactions.map((estimate) => estimate.transactionNo)).toEqual(expected);
  });

  it("filters by a trimmed, case-insensitive customer substring within the date range", async () => {
    const matchingCustomer = await seedCustomer(db, { name: "Northwind Quote Counter" });
    const otherCustomer = await seedCustomer(db, { name: "Southwind Retail" });
    await seedEstimate(db, {
      estimateNo: 301,
      customerId: matchingCustomer.id,
      grandTotal: 10000,
      createdAt: "2026-06-01T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 302,
      customerId: matchingCustomer.id,
      grandTotal: 20000,
      createdAt: "2026-06-03T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 303,
      customerId: matchingCustomer.id,
      grandTotal: 40000,
      createdAt: "2026-05-31T23:59:59.999Z"
    });
    await seedEstimate(db, {
      estimateNo: 304,
      customerId: otherCustomer.id,
      grandTotal: 30000,
      createdAt: "2026-06-02T00:00:00.000Z"
    });

    const body = await readJson<EstimateList>(
      await getJson(
        app,
        `/api/estimates?search=${encodeURIComponent(" QuOtE ")}&from=2026-06-01T00:00:00.000Z&to=2026-06-03T23:59:59.999Z&sortBy=high_to_low`
      )
    );

    expect(body).toMatchObject({ totalRevenue: 30000, totalTransactions: 2, nextPageNo: null });
    expect(body.transactions.map((estimate) => estimate.transactionNo)).toEqual([302, 301]);
  });

  it.each([
    ["305", [305], 10000],
    ["#306", [306], 20000],
    ["05", [], 0]
  ])("matches exact estimate number search %s", async (search, expected, totalRevenue) => {
    const customer = await seedCustomer(db, { name: "Estimate Document Search" });
    await seedEstimate(db, {
      estimateNo: 305,
      customerId: customer.id,
      grandTotal: 10000,
      createdAt: "2026-06-01T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 306,
      customerId: customer.id,
      grandTotal: 20000,
      createdAt: "2026-06-02T00:00:00.000Z"
    });

    const body = await readJson<EstimateList>(
      await getJson(
        app,
        `/api/estimates?search=${encodeURIComponent(search)}&from=2026-06-01T00:00:00.000Z&to=2026-06-03T00:00:00.000Z`
      )
    );

    expect(body.transactions.map((estimate) => estimate.transactionNo)).toEqual(expected);
    expect(body).toMatchObject({
      totalRevenue,
      totalTransactions: expected.length,
      nextPageNo: null
    });
  });

  it.each([
    ["date_oldest_first", [311, 312, 313]],
    ["date_newest_first", [313, 312, 311]],
    ["low_to_high", [311, 313, 312]],
    ["high_to_low", [312, 313, 311]]
  ])("sorts searched estimates with %s", async (sortBy, expected) => {
    const customer = await seedCustomer(db, { name: "Matched Quotes" });
    await seedEstimate(db, {
      estimateNo: 311,
      customerId: customer.id,
      grandTotal: 10000,
      createdAt: "2026-06-01T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 312,
      customerId: customer.id,
      grandTotal: 30000,
      createdAt: "2026-06-02T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 313,
      customerId: customer.id,
      grandTotal: 20000,
      createdAt: "2026-06-03T00:00:00.000Z"
    });

    const body = await readJson<EstimateList>(
      await getJson(
        app,
        `/api/estimates?search=matched&from=2026-06-01T00:00:00.000Z&to=2026-06-03T00:00:00.000Z&sortBy=${sortBy}`
      )
    );
    expect(body.transactions.map((estimate) => estimate.transactionNo)).toEqual(expected);
  });

  it("paginates and summarizes all filtered estimates", async () => {
    const first = await seedCustomer(db, { name: "Quote Group Alpha" });
    const second = await seedCustomer(db, { name: "Quote Group Beta" });
    const third = await seedCustomer(db, { name: "Quote Group Gamma" });
    const excluded = await seedCustomer(db, { name: "Retail Delta" });
    await seedEstimate(db, {
      estimateNo: 321,
      customerId: first.id,
      grandTotal: 10000,
      createdAt: "2026-06-01T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 322,
      customerId: second.id,
      grandTotal: 20000,
      createdAt: "2026-06-02T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 323,
      customerId: third.id,
      grandTotal: 30000,
      createdAt: "2026-06-03T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 324,
      customerId: excluded.id,
      grandTotal: 40000,
      createdAt: "2026-06-04T00:00:00.000Z"
    });

    const base =
      "/api/estimates?search=quote%20group&from=2026-06-01T00:00:00.000Z&to=2026-06-04T00:00:00.000Z&sortBy=date_oldest_first&pageSize=2";
    const firstPage = await readJson<EstimateList>(await getJson(app, base));
    expect(firstPage).toMatchObject({ totalRevenue: 60000, totalTransactions: 3, nextPageNo: 2 });
    expect(firstPage.transactions.map((estimate) => estimate.transactionNo)).toEqual([321, 322]);

    const secondPage = await readJson<EstimateList>(await getJson(app, `${base}&pageNo=2`));
    expect(secondPage).toMatchObject({
      totalRevenue: 60000,
      totalTransactions: 3,
      nextPageNo: null
    });
    expect(secondPage.transactions.map((estimate) => estimate.transactionNo)).toEqual([323]);
  });

  it("treats percent and underscore search characters literally", async () => {
    const percent = await seedCustomer(db, { name: "Quote % Market" });
    const percentWildcard = await seedCustomer(db, { name: "Quote X Market" });
    const underscore = await seedCustomer(db, { name: "Quote_under Market" });
    const underscoreWildcard = await seedCustomer(db, { name: "QuoteXunder Market" });
    await seedEstimate(db, {
      estimateNo: 331,
      customerId: percent.id,
      grandTotal: 10000,
      createdAt: "2026-06-01T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 332,
      customerId: percentWildcard.id,
      grandTotal: 20000,
      createdAt: "2026-06-01T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 333,
      customerId: underscore.id,
      grandTotal: 30000,
      createdAt: "2026-06-01T00:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 334,
      customerId: underscoreWildcard.id,
      grandTotal: 40000,
      createdAt: "2026-06-01T00:00:00.000Z"
    });
    const range = "&from=2026-06-01T00:00:00.000Z&to=2026-06-01T23:59:59.999Z";

    const percentBody = await readJson<EstimateList>(
      await getJson(app, `/api/estimates?search=${encodeURIComponent("%")}${range}`)
    );
    const underscoreBody = await readJson<EstimateList>(
      await getJson(app, `/api/estimates?search=${encodeURIComponent("_")}${range}`)
    );

    expect(percentBody.transactions.map((estimate) => estimate.transactionNo)).toEqual([331]);
    expect(percentBody).toMatchObject({ totalRevenue: 10000, totalTransactions: 1 });
    expect(underscoreBody.transactions.map((estimate) => estimate.transactionNo)).toEqual([333]);
    expect(underscoreBody).toMatchObject({ totalRevenue: 30000, totalTransactions: 1 });
  });
  it("returns an empty summary when the date range has no estimates", async () => {
    const body = await readJson<EstimateList>(
      await getJson(app, "/api/estimates?from=2025-01-01T00:00:00.000Z&to=2025-01-02T00:00:00.000Z")
    );
    expect(body).toEqual({
      nextPageNo: null,
      totalRevenue: 0,
      totalTransactions: 0,
      transactions: []
    });
  });

  it.each([
    "/api/estimates?pageNo=0",
    "/api/estimates?pageSize=0",
    "/api/estimates?pageSize=101",
    "/api/estimates?sortBy=unknown",
    "/api/estimates?from=not-a-date",
    "/api/estimates?to=not-a-date",
    `/api/estimates?search=${"a".repeat(101)}`
  ])("rejects invalid list query %s", async (pathname) => {
    expect((await getJson(app, pathname)).status).toBe(400);
  });
});
