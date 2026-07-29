import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardController } from "../../../modules/dashboard/dashboard.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  getJson,
  readJson,
  seedCustomer,
  seedEstimate,
  seedProduct,
  seedSale,
  type DB
} from "../../helpers";

type DashboardSummary = {
  counts: { customers: number; products: number; sales: number; estimates: number };
  sales: { today: number; yesterday: number; changePercent: number; trend: string };
  estimates: { today: number; yesterday: number; changePercent: number; trend: string };
};

describe("dashboard integration", () => {
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
    app = createModuleTestApp([{ path: "/api/dashboard", controller: dashboardController }]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
    vi.useRealTimers();
  });

  it("returns empty dashboard metrics and transaction lists", async () => {
    const summary = await getJson(app, "/api/dashboard/summary");
    expect(await readJson<DashboardSummary>(summary)).toEqual({
      counts: { customers: 0, products: 0, sales: 0, estimates: 0 },
      sales: { today: 0, yesterday: 0, changePercent: 0, trend: "no change" },
      estimates: { today: 0, yesterday: 0, changePercent: 0, trend: "no change" }
    });

    expect(await readJson(await getJson(app, "/api/dashboard/top-products"))).toEqual([]);
    expect(await readJson(await getJson(app, "/api/dashboard/recent-transactions/sale"))).toEqual(
      []
    );
    expect(
      await readJson(await getJson(app, "/api/dashboard/recent-transactions/estimate"))
    ).toEqual([]);
  });

  it("counts active records and calculates daily revenue trends in paisa", async () => {
    const customer = await seedCustomer(db, { name: "Dashboard Customer" });
    await seedProduct(db, { name: "Active Product" });
    await seedProduct(db, { name: "Disabled Product", isDisabled: true });
    await seedProduct(db, { name: "Deleted Product", isDeleted: true });
    await seedSale(db, {
      invoiceNo: 601,
      customerId: customer.id,
      grandTotal: 20000,
      createdAt: "2026-07-29T08:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 602,
      customerId: customer.id,
      grandTotal: 10000,
      createdAt: "2026-07-28T08:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 701,
      customerId: customer.id,
      grandTotal: 15000,
      createdAt: "2026-07-29T08:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 702,
      customerId: customer.id,
      grandTotal: 30000,
      createdAt: "2026-07-28T08:00:00.000Z"
    });

    const response = await getJson(app, "/api/dashboard/summary");
    expect(await readJson<DashboardSummary>(response)).toEqual({
      counts: { customers: 1, products: 1, sales: 2, estimates: 2 },
      sales: { today: 20000, yesterday: 10000, changePercent: 100, trend: "increase" },
      estimates: { today: 15000, yesterday: 30000, changePercent: -50, trend: "decrease" }
    });
  });

  it("orders top products and returns quantity shares", async () => {
    await seedProduct(db, { name: "Coffee", totalQuantitySold: 6000 });
    await seedProduct(db, { name: "Tea", totalQuantitySold: 3000 });
    await seedProduct(db, { name: "Sugar", totalQuantitySold: 1000 });

    const response = await getJson(app, "/api/dashboard/top-products");
    const body =
      await readJson<Array<{ name: string; totalQuantitySold: number; sharePercent: number }>>(
        response
      );

    expect(body).toEqual([
      expect.objectContaining({ name: "Coffee", totalQuantitySold: 6000, sharePercent: 60 }),
      expect.objectContaining({ name: "Tea", totalQuantitySold: 3000, sharePercent: 30 }),
      expect.objectContaining({ name: "Sugar", totalQuantitySold: 1000, sharePercent: 10 })
    ]);
  });

  it("returns the five newest sales and estimates with customer metadata", async () => {
    const customer = await seedCustomer(db, { name: "Recent Customer" });

    for (let index = 1; index <= 6; index += 1) {
      await seedSale(db, {
        invoiceNo: 800 + index,
        customerId: customer.id,
        grandTotal: index * 1000,
        totalQuantity: index * 1000,
        createdAt: `2026-07-${String(20 + index).padStart(2, "0")}T08:00:00.000Z`,
        recordedAt: `2026-07-${String(20 + index).padStart(2, "0")}T08:00:00.000Z`
      });
    }
    await seedEstimate(db, {
      estimateNo: 901,
      customerId: customer.id,
      grandTotal: 25000,
      totalQuantity: 2000,
      createdAt: "2026-07-27T08:00:00.000Z"
    });

    const sales = await readJson<
      Array<{ transactionNo: number; customerName: string; grandTotal: number }>
    >(await getJson(app, "/api/dashboard/recent-transactions/sale"));
    expect(sales).toHaveLength(5);
    expect(sales.map((sale) => sale.transactionNo)).toEqual([806, 805, 804, 803, 802]);
    expect(sales[0]).toMatchObject({ customerName: "Recent Customer", grandTotal: 6000 });

    const estimates = await readJson<Array<{ transactionNo: number; customerName: string }>>(
      await getJson(app, "/api/dashboard/recent-transactions/estimate")
    );
    expect(estimates).toEqual([
      expect.objectContaining({ transactionNo: 901, customerName: "Recent Customer" })
    ]);
  });

  it("returns daily and monthly chart values in rupees", async () => {
    const customer = await seedCustomer(db, { name: "Chart Customer" });
    await seedSale(db, {
      invoiceNo: 1001,
      customerId: customer.id,
      grandTotal: 12345,
      createdAt: "2026-07-29T08:00:00.000Z"
    });
    await seedEstimate(db, {
      estimateNo: 1101,
      customerId: customer.id,
      grandTotal: 5000,
      createdAt: "2026-07-29T08:00:00.000Z"
    });

    const daily = await readJson<Array<{ label: string; sales: number; estimates: number }>>(
      await getJson(app, "/api/dashboard/sales-vs-estimates?timePeriod=last_7_days")
    );
    expect(daily).toEqual([
      expect.objectContaining({
        label: expect.stringMatching(/^29-/),
        sales: 123.45,
        estimates: 50
      })
    ]);

    const monthly = await readJson<Array<{ label: string; sales: number; estimates: number }>>(
      await getJson(app, "/api/dashboard/sales-vs-estimates?timePeriod=this_year")
    );
    expect(monthly).toHaveLength(7);
    expect(monthly.at(-1)).toEqual({ label: "Jul", sales: 123.45, estimates: 50 });
  });

  it("rejects invalid chart periods and transaction types", async () => {
    expect(
      (await getJson(app, "/api/dashboard/sales-vs-estimates?timePeriod=forever")).status
    ).toBe(400);
    expect((await getJson(app, "/api/dashboard/recent-transactions/refund")).status).toBe(400);
  });
});
