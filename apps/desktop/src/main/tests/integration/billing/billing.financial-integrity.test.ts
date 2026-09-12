import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SyncResponse } from "../../../../shared/types";
import { roundPaisaToNearestRupee } from "../../../../shared/utils/utils";
import { customerLedger, customers, products, saleItems, sales } from "../../../db/schema";
import { salesController } from "../../../modules/sales/sales.controller";
import {
  createModuleTestApp,
  createTestDb,
  dbMock,
  postTxn,
  readJson,
  salePayload,
  seedCustomer,
  seedProduct,
  transactionItem,
  type DB
} from "../../helpers";

describe("billing financial-integrity API integration", () => {
  let app: ReturnType<typeof createModuleTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createModuleTestApp([{ path: "/api/sales", controller: salesController }]);
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  it("persists 200 ordered catalog lines with exact aggregate paisa and milli-units", async () => {
    const customer = await seedCustomer(db);
    const seededProducts = await Promise.all(
      Array.from({ length: 200 }, (_, index) =>
        seedProduct(db, {
          name: `Stress Product ${String(index + 1).padStart(3, "0")}`,
          productSnapshot: `Stress Product ${String(index + 1).padStart(3, "0")} snapshot`,
          price: 1000 + index,
          totalQuantitySold: 0
        })
      )
    );
    const items = seededProducts.map((product, index) => {
      const quantity = 1000 + (index % 7) * 125;
      return transactionItem({
        rowId: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        productSnapshot: product.productSnapshot,
        price: product.price,
        quantity,
        position: index * 65_536
      });
    });
    const expectedTotal = roundPaisaToNearestRupee(
      items.reduce((sum, item) => sum + Math.round((item.price * item.quantity) / 1000), 0)
    );
    const expectedQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    const response = await postTxn(app, "/api/sales/create", salePayload(customer.id, { items }));
    const created = await readJson<SyncResponse>(response);

    expect(response.status, JSON.stringify(created)).toBe(200);
    const sale = db.select().from(sales).where(eq(sales.id, created.billingId!)).get();
    const persisted = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, created.billingId!))
      .all()
      .sort((first, second) => first.position - second.position);
    expect(sale).toMatchObject({
      grandTotal: expectedTotal,
      totalQuantity: expectedQuantity
    });
    expect(persisted).toHaveLength(200);
    expect([persisted[0]?.name, persisted[99]?.name, persisted[199]?.name]).toEqual([
      "Stress Product 001",
      "Stress Product 100",
      "Stress Product 200"
    ]);
    expect(persisted.map((item) => item.position)).toEqual(
      Array.from({ length: 200 }, (_, index) => index * 65_536)
    );
    for (const index of [0, 99, 199]) {
      expect(
        db.select().from(products).where(eq(products.id, seededProducts[index]!.id)).get()
          ?.totalQuantitySold
      ).toBe(items[index]!.quantity);
    }
  });

  it("keeps duplicate catalog selections separate with sparse ordering and one counter delta", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 0, price: 6800 });
    const items = [
      transactionItem({
        rowId: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        productSnapshot: product.productSnapshot,
        price: product.price,
        quantity: 1000,
        position: 0
      }),
      transactionItem({
        rowId: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        productSnapshot: product.productSnapshot,
        price: product.price,
        quantity: 2500,
        position: 65_536
      })
    ];

    const response = await postTxn(app, "/api/sales/create", salePayload(customer.id, { items }));
    const created = await readJson<SyncResponse>(response);
    const persisted = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, created.billingId!))
      .all()
      .sort((first, second) => first.position - second.position);

    expect(response.status).toBe(200);
    expect(persisted.map((item) => item.productId)).toEqual([product.id, product.id]);
    expect(persisted.map((item) => item.position)).toEqual([0, 65_536]);
    expect(persisted.map((item) => item.totalPrice)).toEqual([6800, 17_000]);
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(3500);
  });

  it("cannot update or delete an item owned by another sale", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db, { totalQuantitySold: 0 });
    const create = async () => {
      const response = await postTxn(
        app,
        "/api/sales/create",
        salePayload(customer.id, {
          items: [
            transactionItem({
              productId: product.id,
              name: product.name,
              productSnapshot: product.productSnapshot
            })
          ]
        })
      );
      return readJson<SyncResponse>(response);
    };
    const [saleA, saleB] = await Promise.all([create(), create()]);
    const foreignItem = db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, saleB.billingId!))
      .get()!;
    const beforeForeign = { ...foreignItem };
    const beforeSaleB = {
      ...db.select().from(sales).where(eq(sales.id, saleB.billingId!)).get()!
    };
    const adversarial = (isDeleted: boolean) =>
      postTxn(
        app,
        `/api/sales/${saleA.billingId}/sync`,
        salePayload(customer.id, {
          items: [
            transactionItem({
              id: foreignItem.id,
              productId: product.id,
              name: "Foreign mutation attempt",
              productSnapshot: "Foreign mutation attempt",
              quantity: 9000,
              isDeleted
            })
          ]
        })
      );

    await adversarial(false);
    await adversarial(true);

    expect(db.select().from(saleItems).where(eq(saleItems.id, foreignItem.id)).get()).toEqual(
      beforeForeign
    );
    expect(db.select().from(sales).where(eq(sales.id, saleB.billingId!)).get()).toEqual(
      beforeSaleB
    );
  });

  it("moves one accounted sale between customers atomically at the latest exact total", async () => {
    const customerA = await seedCustomer(db, {
      name: "Account A",
      customerType: "account",
      outstandingBalance: 0
    });
    const customerB = await seedCustomer(db, {
      name: "Account B",
      customerType: "account",
      outstandingBalance: 0
    });
    const product = await seedProduct(db, { totalQuantitySold: 0, price: 10_000 });
    const create = await postTxn(
      app,
      "/api/sales/create",
      salePayload(customerA.id, {
        addToAccounting: true,
        items: [
          transactionItem({
            productId: product.id,
            name: product.name,
            productSnapshot: product.productSnapshot,
            price: 10_000,
            quantity: 1000
          })
        ]
      })
    );
    const created = await readJson<SyncResponse>(create);
    const item = db.select().from(saleItems).where(eq(saleItems.saleId, created.billingId!)).get()!;

    const move = await postTxn(
      app,
      `/api/sales/${created.billingId}/sync`,
      salePayload(customerB.id, {
        addToAccounting: true,
        items: [
          transactionItem({
            id: item.id,
            productId: product.id,
            name: product.name,
            productSnapshot: product.productSnapshot,
            price: 12_345,
            quantity: 2125
          })
        ]
      })
    );

    expect(move.status).toBe(200);
    expect(db.select().from(sales).where(eq(sales.id, created.billingId!)).get()).toMatchObject({
      customerId: customerB.id,
      grandTotal: 26_200,
      totalQuantity: 2125
    });
    expect(
      db.select().from(customerLedger).where(eq(customerLedger.saleId, created.billingId!)).all()
    ).toEqual([
      expect.objectContaining({
        customerId: customerB.id,
        amountDue: 26_200
      })
    ]);
    expect(
      db.select().from(customers).where(eq(customers.id, customerA.id)).get()?.outstandingBalance
    ).toBe(0);
    expect(
      db.select().from(customers).where(eq(customers.id, customerB.id)).get()?.outstandingBalance
    ).toBe(26_200);
    expect(
      db.select().from(products).where(eq(products.id, product.id)).get()?.totalQuantitySold
    ).toBe(2125);
  });
});
