import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { customerLedger } from "../../../db/schema";
import { CustomerRole } from "../../../db/enum";
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

type CustomerList = {
  nextPageNo: number | null;
  totalCount: number;
  data: Array<{
    id: string;
    name: string;
    customerType: string;
    isArchived: boolean;
    lastPurchaseAt: string | null;
    lastPurchaseAmt: number | null;
    lastPaymentAt: string | null;
    lastPaymentAmt: number | null;
  }>;
};

describe("customers search integration", () => {
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

  it("filters by prefix, type, archive state, and case-insensitive query", async () => {
    await seedCustomer(db, { name: "Bravo Account", customerType: CustomerRole.ACCOUNT });
    await seedCustomer(db, { name: "brisk Hotel", customerType: CustomerRole.HOTEL });
    await seedCustomer(db, { name: "Alpha Cash", customerType: CustomerRole.CASH });
    await seedCustomer(db, {
      name: "Broken Archived",
      customerType: CustomerRole.ACCOUNT,
      isArchived: true,
      archivedAt: "2026-01-03T00:00:00.000Z"
    });

    const account = await readJson<CustomerList>(
      await getJson(app, "/api/customers?query=br&type=account")
    );
    expect(account.data.map((customer) => customer.name)).toEqual(["Bravo Account"]);

    const allTypes = await readJson<CustomerList>(
      await getJson(app, "/api/customers?query=BR&includeArchived=true")
    );
    expect(allTypes.data.map((customer) => customer.name)).toEqual([
      "Bravo Account",
      "Broken Archived",
      "brisk Hotel"
    ]);
  });

  it.each([
    ["name_asc", ["Alpha Cash", "Bravo Account", "Charlie Hotel"]],
    ["name_desc", ["Charlie Hotel", "Bravo Account", "Alpha Cash"]],
    ["newest", ["Charlie Hotel", "Bravo Account", "Alpha Cash"]],
    ["oldest", ["Alpha Cash", "Bravo Account", "Charlie Hotel"]]
  ])("supports %s ordering", async (sort, expected) => {
    await seedCustomer(db, {
      name: "Alpha Cash",
      createdAt: "2026-01-01T00:00:00.000Z"
    });
    await seedCustomer(db, {
      name: "Bravo Account",
      createdAt: "2026-01-02T00:00:00.000Z"
    });
    await seedCustomer(db, {
      name: "Charlie Hotel",
      createdAt: "2026-01-03T00:00:00.000Z"
    });

    const body = await readJson<CustomerList>(await getJson(app, `/api/customers?sort=${sort}`));
    expect(body.data.map((customer) => customer.name)).toEqual(expected);
  });

  it("paginates with exact final-page semantics", async () => {
    await seedCustomer(db, { name: "Alpha Cash" });
    await seedCustomer(db, { name: "Bravo Cash" });
    await seedCustomer(db, { name: "Charlie Cash" });

    const first = await readJson<CustomerList>(
      await getJson(app, "/api/customers?pageSize=2&sort=name_asc")
    );
    expect(first).toMatchObject({ totalCount: 3, nextPageNo: 2 });
    expect(first.data.map((customer) => customer.name)).toEqual(["Alpha Cash", "Bravo Cash"]);

    const second = await readJson<CustomerList>(
      await getJson(app, "/api/customers?pageSize=2&pageNo=2&sort=name_asc")
    );
    expect(second.nextPageNo).toBeNull();
    expect(second.data.map((customer) => customer.name)).toEqual(["Charlie Cash"]);

    const exact = await readJson<CustomerList>(await getJson(app, "/api/customers?pageSize=3"));
    expect(exact).toMatchObject({ totalCount: 3, nextPageNo: null });
  });

  it("projects latest purchase and payment metadata", async () => {
    const customer = await seedCustomer(db, { name: "Metadata Customer" });
    await seedSale(db, {
      invoiceNo: 201,
      customerId: customer.id,
      grandTotal: 10000,
      createdAt: "2026-01-01T00:00:00.000Z"
    });
    await seedSale(db, {
      invoiceNo: 202,
      customerId: customer.id,
      grandTotal: 30000,
      createdAt: "2026-01-03T00:00:00.000Z"
    });
    db.insert(customerLedger)
      .values({
        customerId: customer.id,
        type: "payment",
        amountPaid: 5000,
        createdAt: "2026-01-02T00:00:00.000Z"
      })
      .run();
    db.insert(customerLedger)
      .values({
        customerId: customer.id,
        type: "payment",
        amountPaid: 7000,
        createdAt: "2026-01-04T00:00:00.000Z"
      })
      .run();

    const body = await readJson<CustomerList>(await getJson(app, "/api/customers"));
    expect(body.data[0]).toMatchObject({
      lastPurchaseAt: "2026-01-03T00:00:00.000Z",
      lastPurchaseAmt: 30000,
      lastPaymentAt: "2026-01-04T00:00:00.000Z",
      lastPaymentAmt: 7000
    });
  });

  it("returns empty results for unmatched filters", async () => {
    await seedCustomer(db, { name: "Cash Customer", customerType: CustomerRole.CASH });
    expect(
      await readJson<CustomerList>(await getJson(app, "/api/customers?query=Missing&type=hotel"))
    ).toEqual({ nextPageNo: null, totalCount: 0, data: [] });
  });

  it.each([
    "pageNo=0",
    "pageSize=0",
    "pageSize=101",
    "type=vendor",
    "sort=amount_desc",
    "includeArchived=yes"
  ])("rejects invalid customer query %s", async (query) => {
    expect((await getJson(app, `/api/customers?${query}`)).status).toBe(400);
  });
});
