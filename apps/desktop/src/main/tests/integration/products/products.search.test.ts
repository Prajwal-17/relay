import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createProductsTestApp,
  createTestDb,
  dbMock,
  getJson,
  readJson,
  seedProduct,
  type DB
} from "../../../tests/helpers";

type SearchItem = {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  purchasePrice: number | null;
  isDisabled?: boolean;
  isDeleted?: boolean;
  totalQuantitySold?: number | null;
};

type SearchBody = {
  nextPageNo: number | null;
  totalCount: number;
  data: SearchItem[];
};

describe("products search integration", () => {
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

  async function search(query = "") {
    const response = await getJson(app, `/api/products/search${query}`);
    return { response, body: await readJson<SearchBody>(response) };
  }

  it("defaults an omitted query to an empty active-product search", async () => {
    const active = await seedProduct(db, { name: "Active", productSnapshot: "Active" });
    await seedProduct(db, {
      name: "Inactive",
      productSnapshot: "Inactive",
      isDisabled: true
    });

    const { response, body } = await search();

    expect(response.status).toBe(200);
    expect(body.totalCount).toBe(1);
    expect(body.data.map((item) => item.id)).toEqual([active.id]);
  });

  it.each([
    ["active", ["Active"]],
    ["inactive", ["Inactive"]],
    ["deleted", ["Deleted"]],
    ["all", ["Active", "Inactive"]]
  ])("applies the %s lifecycle filter", async (filterType, expectedNames) => {
    await seedProduct(db, { name: "Active", productSnapshot: "Active" });
    await seedProduct(db, {
      name: "Inactive",
      productSnapshot: "Inactive",
      isDisabled: true
    });
    await seedProduct(db, {
      name: "Deleted",
      productSnapshot: "Deleted",
      isDeleted: true
    });

    const { body } = await search(`?filterType=${filterType}`);
    expect(body.data.map((item) => item.name)).toEqual(expectedNames);
    expect(body.totalCount).toBe(expectedNames.length);
  });

  it("matches query text case-insensitively and ranks prefix matches before contained matches", async () => {
    const contained = await seedProduct(db, {
      name: "Chocolate Milk",
      productSnapshot: "Chocolate Milk 1L"
    });
    const prefix = await seedProduct(db, {
      name: "Milk Powder",
      productSnapshot: "Milk Powder 500g"
    });
    await seedProduct(db, { name: "Tea", productSnapshot: "Assam Tea" });

    const { body } = await search("?query=MILK");
    expect(body.data.map((item) => item.id)).toEqual([prefix.id, contained.id]);
  });

  it.each([
    ["name_asc", ["Alpha", "Bravo", "Charlie"]],
    ["name_desc", ["Charlie", "Bravo", "Alpha"]],
    ["price_low_high", ["Bravo", "Charlie", "Alpha"]],
    ["price_high_low", ["Alpha", "Charlie", "Bravo"]],
    ["mrp_low_high", ["Charlie", "Alpha", "Bravo"]],
    ["mrp_high_low", ["Bravo", "Alpha", "Charlie"]]
  ])("supports %s sorting", async (sortBy, expectedNames) => {
    await seedProduct(db, {
      name: "Charlie",
      productSnapshot: "Charlie",
      price: 2000,
      mrp: 1000
    });
    await seedProduct(db, {
      name: "Alpha",
      productSnapshot: "Alpha",
      price: 3000,
      mrp: 2000
    });
    await seedProduct(db, {
      name: "Bravo",
      productSnapshot: "Bravo",
      price: 1000,
      mrp: 3000
    });

    const { body } = await search(`?sortBy=${sortBy}`);
    expect(body.data.map((item) => item.name)).toEqual(expectedNames);
  });

  it("uses inclusive price bounds and combines them with lifecycle and query filters", async () => {
    const lower = await seedProduct(db, {
      name: "Rice Basic",
      productSnapshot: "Rice Basic",
      price: 1000
    });
    const upper = await seedProduct(db, {
      name: "Rice Premium",
      productSnapshot: "Rice Premium",
      price: 2000
    });
    await seedProduct(db, {
      name: "Rice Disabled",
      productSnapshot: "Rice Disabled",
      price: 1500,
      isDisabled: true
    });
    await seedProduct(db, { name: "Wheat", productSnapshot: "Wheat", price: 1500 });

    const { body } = await search(
      "?query=rice&filterType=active&priceMin=1000&priceMax=2000&sortBy=price_low_high"
    );
    expect(body.data.map((item) => item.id)).toEqual([lower.id, upper.id]);
  });

  it("parses MRP and purchase-price flags as literal booleans", async () => {
    await seedProduct(db, {
      name: "Complete",
      productSnapshot: "Complete",
      mrp: 2000,
      purchasePrice: 1000
    });
    await seedProduct(db, {
      name: "No MRP",
      productSnapshot: "No MRP",
      mrp: null,
      purchasePrice: 1000
    });
    await seedProduct(db, {
      name: "No Purchase",
      productSnapshot: "No Purchase",
      mrp: 2000,
      purchasePrice: null
    });

    const falseFlags = await search("?hasMrp=false&hasPurchasePrice=false");
    expect(falseFlags.body.totalCount).toBe(3);

    const trueFlags = await search("?hasMrp=true&hasPurchasePrice=true");
    expect(trueFlags.body.data.map((item) => item.name)).toEqual(["Complete"]);

    const invalid = await getJson(app, "/api/products/search?hasMrp=1");
    expect(invalid.status).toBe(400);
  });

  it("returns billing projections without lifecycle and sales-only fields", async () => {
    await seedProduct(db, {
      name: "Billing Product",
      productSnapshot: "Billing Product",
      totalQuantitySold: 9000
    });

    const { body } = await search("?billingMode=true");
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).not.toHaveProperty("isDisabled");
    expect(body.data[0]).not.toHaveProperty("isDeleted");
    expect(body.data[0]).not.toHaveProperty("totalQuantitySold");
    expect(body.data[0]).toMatchObject({ name: "Billing Product", price: 6000 });
  });

  it("reports empty searches with a zero count", async () => {
    await seedProduct(db, { name: "Coffee", productSnapshot: "Coffee" });

    const { body } = await search("?query=missing");
    expect(body).toEqual({ nextPageNo: null, totalCount: 0, data: [] });
  });

  it("uses the requested page size for totals and next-page calculation", async () => {
    for (let index = 1; index <= 5; index += 1) {
      await seedProduct(db, {
        name: `Product ${index}`,
        productSnapshot: `Product ${index}`
      });
    }

    const first = await search("?pageNo=1&pageSize=2&sortBy=name_asc");
    expect(first.body).toMatchObject({ totalCount: 5, nextPageNo: 2 });
    expect(first.body.data).toHaveLength(2);

    const second = await search("?pageNo=2&pageSize=2&sortBy=name_asc");
    expect(second.body).toMatchObject({ totalCount: 5, nextPageNo: 3 });
    expect(second.body.data).toHaveLength(2);

    const final = await search("?pageNo=3&pageSize=2&sortBy=name_asc");
    expect(final.body).toMatchObject({ totalCount: 5, nextPageNo: null });
    expect(final.body.data).toHaveLength(1);
  });

  it("returns null for an exact final search page and rejects pageSize zero", async () => {
    for (let index = 1; index <= 4; index += 1) {
      await seedProduct(db, {
        name: `Exact ${index}`,
        productSnapshot: `Exact ${index}`
      });
    }

    const final = await search("?pageNo=2&pageSize=2");
    expect(final.body).toMatchObject({ totalCount: 4, nextPageNo: null });
    expect(final.body.data).toHaveLength(2);

    const invalid = await getJson(app, "/api/products/search?pageSize=0");
    expect(invalid.status).toBe(400);
    expect((await readJson<{ error: { message: string } }>(invalid)).error.message).toContain(
      "expected number to be >0"
    );
  });
});
