import type { CreateProductPayload } from "../../../../shared/types";
import { products } from "../../../db/schema";
import type { DB } from "../database";

export function productPayload(
  overrides: Partial<CreateProductPayload> = {}
): CreateProductPayload {
  return {
    name: "Arabica Coffee",
    imageUrl: null,
    weight: "500",
    unit: "g",
    mrp: 45000,
    price: 39900,
    purchasePrice: 31000,
    isDisabled: false,
    ...overrides
  };
}

export async function seedProduct(db: DB, overrides: Partial<typeof products.$inferInsert> = {}) {
  const product = {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? "Test Product 1",
    productSnapshot: overrides.productSnapshot ?? "Test Product 1",
    weight: overrides.weight ?? "1",
    unit: overrides.unit ?? "pc",
    mrp: overrides.mrp ?? 7000,
    price: overrides.price ?? 6000,
    purchasePrice: overrides.purchasePrice ?? 5000,
    totalQuantitySold: overrides.totalQuantitySold ?? 10,
    isDisabled: overrides.isDisabled ?? false,
    disabledAt: overrides.disabledAt ?? null,
    isDeleted: overrides.isDeleted ?? false,
    deletedAt: overrides.deletedAt ?? null,
    ...overrides
  } satisfies typeof products.$inferInsert;

  return db.insert(products).values(product).returning().get();
}
