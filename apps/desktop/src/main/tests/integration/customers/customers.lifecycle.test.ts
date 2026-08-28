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
  seedEstimate,
  seedSale,
  type DB
} from "../../helpers";

type CustomerList = {
  data: Array<{ id: string }>;
};

describe("customers lifecycle integration", () => {
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

  it("archives and restores a customer with search visibility and timestamps", async () => {
    const customer = await seedCustomer(db, { name: "Lifecycle Customer" });

    const archived = await requestJson(app, "PATCH", `/api/customers/${customer.id}/archive`);
    expect(archived.status).toBe(200);
    expect(await readJson(archived)).toEqual({ status: "success", data: null });
    expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toMatchObject({
      isArchived: true,
      archivedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
    });
    expect((await readJson<CustomerList>(await getJson(app, "/api/customers"))).data).toEqual([]);
    expect(
      (await readJson<CustomerList>(await getJson(app, "/api/customers?includeArchived=true"))).data
    ).toEqual([expect.objectContaining({ id: customer.id })]);

    const restored = await requestJson(app, "PATCH", `/api/customers/${customer.id}/restore`);
    expect(restored.status).toBe(200);
    expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toMatchObject({
      isArchived: false,
      archivedAt: null
    });
    expect((await readJson<CustomerList>(await getJson(app, "/api/customers"))).data).toEqual([
      expect.objectContaining({ id: customer.id })
    ]);
  });

  it("deletes an unlinked customer", async () => {
    const customer = await seedCustomer(db, { name: "Disposable Customer" });

    const response = await requestJson(app, "DELETE", `/api/customers/${customer.id}`);

    expect(response.status).toBe(204);
    expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toBeUndefined();
  });

  it("protects the default customer from rename, archive, and deletion", async () => {
    const customer = await seedCustomer(db, { name: "DEFAULT" });

    expect((await getJson(app, "/api/customers/default")).status).toBe(200);
    expect(
      (
        await requestJson(app, "POST", `/api/customers/${customer.id}`, {
          name: "Walk In"
        })
      ).status
    ).toBe(400);
    expect((await requestJson(app, "PATCH", `/api/customers/${customer.id}/archive`)).status).toBe(
      400
    );
    expect((await requestJson(app, "DELETE", `/api/customers/${customer.id}`)).status).toBe(400);
    expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toMatchObject({
      name: "DEFAULT",
      isArchived: false
    });
  });

  it.each(["sale", "estimate", "ledger"])(
    "blocks deletion when a customer has a linked %s",
    async (linkType) => {
      const customer = await seedCustomer(db, { name: `Linked ${linkType}` });
      if (linkType === "sale") {
        await seedSale(db, { invoiceNo: 301, customerId: customer.id });
      } else if (linkType === "estimate") {
        await seedEstimate(db, { estimateNo: 401, customerId: customer.id });
      } else {
        db.insert(customerLedger)
          .values({ customerId: customer.id, type: "quick_sale", amountDue: 1000 })
          .run();
      }
      const before = db.select().from(customers).where(eq(customers.id, customer.id)).get();

      const response = await requestJson(app, "DELETE", `/api/customers/${customer.id}`);

      expect(response.status).toBe(400);
      expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toEqual(
        before
      );
    }
  );

  it("handles invalid and missing lifecycle IDs without changing customers", async () => {
    const customer = await seedCustomer(db, { name: "Stable Customer" });
    const before = db.select().from(customers).where(eq(customers.id, customer.id)).get();
    const missing = crypto.randomUUID();

    expect((await requestJson(app, "PATCH", "/api/customers/bad/archive")).status).toBe(400);
    expect((await requestJson(app, "PATCH", `/api/customers/${missing}/archive`)).status).toBe(404);
    expect((await requestJson(app, "PATCH", `/api/customers/${missing}/restore`)).status).toBe(404);
    expect((await requestJson(app, "DELETE", `/api/customers/${missing}`)).status).toBe(400);
    expect(db.select().from(customers).where(eq(customers.id, customer.id)).get()).toEqual(before);
  });

  it("returns 404 when the default customer is absent", async () => {
    expect((await getJson(app, "/api/customers/default")).status).toBe(404);
  });
});
