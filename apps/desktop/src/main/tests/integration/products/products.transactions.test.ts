import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createProductsTestApp,
  createTestDb,
  dbMock,
  getJson,
  readJson,
  seedCustomer,
  seedEstimate,
  seedEstimateItem,
  seedProduct,
  seedSale,
  seedSaleItem,
  type DB
} from "../../../tests/helpers";

type Transaction = {
  id: string;
  type: "sale" | "estimate";
  transactionNo: number;
  customerName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  createdAt: string;
};

type TransactionBody = {
  nextPageNo: number | null;
  totalCount: number;
  data: Transaction[];
};

describe("product transactions integration", () => {
  let app: ReturnType<typeof createProductsTestApp>;
  let db!: DB;
  let sqlite: ReturnType<typeof createTestDb>["sqlite"] | undefined;

  beforeEach(() => {
    const setup = createTestDb();
    sqlite = setup.sqlite;
    db = setup.db;
    dbMock.instance = db;
    app = createProductsTestApp();
  });

  afterEach(() => {
    dbMock.instance = null;
    sqlite?.close();
  });

  async function addSaleTransaction(params: {
    productId: string;
    customerId: string;
    transactionNo: number;
    createdAt: string;
    quantity: number;
    price: number;
  }) {
    const sale = await seedSale(db, {
      invoiceNo: params.transactionNo,
      customerId: params.customerId,
      createdAt: params.createdAt
    });
    await seedSaleItem(db, {
      saleId: sale.id,
      productId: params.productId,
      quantity: params.quantity,
      price: params.price,
      totalPrice: Math.round((params.quantity / 1000) * params.price)
    });
    return sale;
  }

  async function addEstimateTransaction(params: {
    productId: string;
    customerId: string;
    transactionNo: number;
    createdAt: string;
    quantity: number;
    price: number;
  }) {
    const estimate = await seedEstimate(db, {
      estimateNo: params.transactionNo,
      customerId: params.customerId,
      createdAt: params.createdAt
    });
    await seedEstimateItem(db, {
      estimateId: estimate.id,
      productId: params.productId,
      quantity: params.quantity,
      price: params.price,
      totalPrice: Math.round((params.quantity / 1000) * params.price)
    });
    return estimate;
  }

  it("merges sale and estimate rows newest first with customer and integer value metadata", async () => {
    const customer = await seedCustomer(db, { name: "Anita Stores" });
    const product = await seedProduct(db);

    const sale501 = await addSaleTransaction({
      productId: product.id,
      customerId: customer.id,
      transactionNo: 501,
      createdAt: "2026-04-01T09:00:00.000Z",
      quantity: 1250,
      price: 12000
    });
    const estimate601 = await addEstimateTransaction({
      productId: product.id,
      customerId: customer.id,
      transactionNo: 601,
      createdAt: "2026-04-03T09:00:00.000Z",
      quantity: 2750,
      price: 11000
    });
    const sale502 = await addSaleTransaction({
      productId: product.id,
      customerId: customer.id,
      transactionNo: 502,
      createdAt: "2026-04-02T09:00:00.000Z",
      quantity: 500,
      price: 13000
    });

    const response = await getJson(app, `/api/products/${product.id}/transactions`);
    const body = await readJson<TransactionBody>(response);

    expect(response.status).toBe(200);
    expect(body.nextPageNo).toBeNull();
    expect(body.totalCount).toBe(3);
    expect(body.data).toEqual([
      {
        id: estimate601.id,
        type: "estimate",
        transactionNo: 601,
        customerName: "Anita Stores",
        quantity: 2750,
        price: 11000,
        totalPrice: 30250,
        createdAt: "2026-04-03T09:00:00.000Z"
      },
      {
        id: sale502.id,
        type: "sale",
        transactionNo: 502,
        customerName: "Anita Stores",
        quantity: 500,
        price: 13000,
        totalPrice: 6500,
        createdAt: "2026-04-02T09:00:00.000Z"
      },
      {
        id: sale501.id,
        type: "sale",
        transactionNo: 501,
        customerName: "Anita Stores",
        quantity: 1250,
        price: 12000,
        totalPrice: 15000,
        createdAt: "2026-04-01T09:00:00.000Z"
      }
    ]);
  });

  it("returns an empty transaction page for a product with no links", async () => {
    const product = await seedProduct(db);

    const response = await getJson(app, `/api/products/${product.id}/transactions`);
    expect(response.status).toBe(200);
    expect(await readJson<TransactionBody>(response)).toEqual({
      nextPageNo: null,
      totalCount: 0,
      data: []
    });
  });

  it("paginates the merged timeline and returns null on an exact final page", async () => {
    const customer = await seedCustomer(db);
    const product = await seedProduct(db);

    for (let index = 1; index <= 4; index += 1) {
      const params = {
        productId: product.id,
        customerId: customer.id,
        transactionNo: 700 + index,
        createdAt: `2026-05-0${index}T10:00:00.000Z`,
        quantity: index * 1000,
        price: index * 1000
      };
      if (index % 2 === 0) {
        await addEstimateTransaction(params);
      } else {
        await addSaleTransaction(params);
      }
    }

    const firstResponse = await getJson(
      app,
      `/api/products/${product.id}/transactions?pageNo=1&pageSize=2`
    );
    const first = await readJson<TransactionBody>(firstResponse);
    expect(first).toMatchObject({ totalCount: 4, nextPageNo: 2 });
    expect(first.data.map((transaction) => transaction.transactionNo)).toEqual([704, 703]);

    const finalResponse = await getJson(
      app,
      `/api/products/${product.id}/transactions?pageNo=2&pageSize=2`
    );
    const final = await readJson<TransactionBody>(finalResponse);
    expect(final).toMatchObject({ totalCount: 4, nextPageNo: null });
    expect(final.data.map((transaction) => transaction.transactionNo)).toEqual([702, 701]);

    const beyondResponse = await getJson(
      app,
      `/api/products/${product.id}/transactions?pageNo=3&pageSize=2`
    );
    expect(await readJson<TransactionBody>(beyondResponse)).toEqual({
      totalCount: 4,
      nextPageNo: null,
      data: []
    });
  });

  it.each(["pageNo=0", "pageSize=0", "pageSize=101"])(
    "rejects invalid pagination %s",
    async (query) => {
      const product = await seedProduct(db);
      const response = await getJson(app, `/api/products/${product.id}/transactions?${query}`);
      expect(response.status).toBe(400);
    }
  );

  it("rejects malformed product IDs before querying transactions", async () => {
    const response = await getJson(app, "/api/products/not-a-uuid/transactions");
    expect(response.status).toBe(400);
    expect((await readJson<{ error: { message: string } }>(response)).error.message).toBe(
      "Id param is invalid"
    );
  });
});
