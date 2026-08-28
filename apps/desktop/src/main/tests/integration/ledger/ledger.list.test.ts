import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { customerLedger } from "../../../db/schema";
import { customersController } from "../../../modules/customers/customers.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  getJson,
  readJson,
  seedCustomer,
  seedSale,
  type DB
} from "../../helpers";

type LedgerList = {
  nextPageNo: number | null;
  totalCount: number;
  data: Array<{
    id: string;
    type: string;
    invoiceNo: number | null;
    amountDue: number;
    amountPaid: number;
    runningBalance: number;
    notes: string | null;
  }>;
};

describe("ledger list integration", () => {
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

  it("returns ordered entries with invoice metadata and running balances", async () => {
    const customer = await seedCustomer(db);
    const sale = await seedSale(db, { invoiceNo: 130, customerId: customer.id });
    db.insert(customerLedger)
      .values({
        id: "00000000-0000-4000-8000-000000000001",
        customerId: customer.id,
        type: "opening_balance",
        amountDue: 50000,
        createdAt: "2026-07-01T08:00:00.000Z"
      })
      .run();
    db.insert(customerLedger)
      .values({
        id: "00000000-0000-4000-8000-000000000002",
        customerId: customer.id,
        saleId: sale.id,
        type: "sale",
        amountDue: 30000,
        createdAt: "2026-07-02T08:00:00.000Z"
      })
      .run();
    db.insert(customerLedger)
      .values({
        id: "00000000-0000-4000-8000-000000000003",
        customerId: customer.id,
        type: "payment",
        amountPaid: 20000,
        paymentMode: "cash",
        createdAt: "2026-07-03T08:00:00.000Z"
      })
      .run();

    const body = await readJson<LedgerList>(
      await getJson(app, `/api/customers/${customer.id}/ledger?sort=date_asc`)
    );

    expect(body).toMatchObject({ totalCount: 3, nextPageNo: null });
    expect(body.data.map((entry) => entry.type)).toEqual(["opening_balance", "sale", "payment"]);
    expect(body.data.map((entry) => entry.runningBalance)).toEqual([50000, 80000, 60000]);
    expect(body.data[1]?.invoiceNo).toBe(130);
  });

  it("filters by type and searches notes", async () => {
    const customer = await seedCustomer(db);
    db.insert(customerLedger)
      .values([
        {
          customerId: customer.id,
          type: "adjustment",
          amountDue: 1000,
          notes: "Delivery fee"
        },
        {
          customerId: customer.id,
          type: "adjustment",
          amountPaid: 500,
          notes: "Round off"
        },
        { customerId: customer.id, type: "payment", amountPaid: 1000, notes: "Delivery cash" }
      ])
      .run();

    const body = await readJson<LedgerList>(
      await getJson(app, `/api/customers/${customer.id}/ledger?type=adjustment&search=Delivery`)
    );
    expect(body.totalCount).toBe(1);
    expect(body.data).toEqual([
      expect.objectContaining({ type: "adjustment", notes: "Delivery fee" })
    ]);
  });

  it("paginates with exact final-page semantics", async () => {
    const customer = await seedCustomer(db);
    for (let index = 1; index <= 3; index += 1) {
      db.insert(customerLedger)
        .values({
          customerId: customer.id,
          type: "quick_sale",
          amountDue: index * 1000,
          createdAt: `2026-07-0${index}T08:00:00.000Z`
        })
        .run();
    }

    const first = await readJson<LedgerList>(
      await getJson(app, `/api/customers/${customer.id}/ledger?pageSize=2&sort=date_asc`)
    );
    expect(first).toMatchObject({ totalCount: 3, nextPageNo: 2 });
    expect(first.data).toHaveLength(2);

    const second = await readJson<LedgerList>(
      await getJson(app, `/api/customers/${customer.id}/ledger?pageSize=2&pageNo=2&sort=date_asc`)
    );
    expect(second.nextPageNo).toBeNull();
    expect(second.data).toHaveLength(1);

    const exactCustomer = await seedCustomer(db, { name: "Exact Ledger" });
    db.insert(customerLedger)
      .values([
        { customerId: exactCustomer.id, type: "quick_sale", amountDue: 1000 },
        { customerId: exactCustomer.id, type: "payment", amountPaid: 500 }
      ])
      .run();
    const exact = await readJson<LedgerList>(
      await getJson(app, `/api/customers/${exactCustomer.id}/ledger?pageSize=2`)
    );
    expect(exact).toMatchObject({ totalCount: 2, nextPageNo: null });
  });

  it("returns empty ledger and summary values for a customer without entries", async () => {
    const customer = await seedCustomer(db);
    expect(await readJson(await getJson(app, `/api/customers/${customer.id}/ledger`))).toEqual({
      nextPageNo: null,
      totalCount: 0,
      data: []
    });
    expect(
      await readJson(await getJson(app, `/api/customers/${customer.id}/ledger-summary`))
    ).toEqual({
      currentBalance: 0,
      totalDue: 0,
      totalPaid: 0,
      openingBalance: 0,
      avgSale: 0,
      salesCount: 0,
      lastPayment: null
    });
  });

  it("returns 404 for ledger reads on a missing customer", async () => {
    const id = crypto.randomUUID();
    expect((await getJson(app, `/api/customers/${id}/ledger`)).status).toBe(404);
    expect((await getJson(app, `/api/customers/${id}/ledger-summary`)).status).toBe(404);
  });

  it.each(["pageNo=0", "pageSize=0", "pageSize=101", "type=refund", "sort=amount_desc"])(
    "rejects invalid ledger query %s",
    async (query) => {
      const customer = await seedCustomer(db);
      expect((await getJson(app, `/api/customers/${customer.id}/ledger?${query}`)).status).toBe(
        400
      );
    }
  );
});
