import type { PublicApi } from "../helpers/api";

export type SeedCustomer = {
  id: string;
  name: string;
  contact: string | null;
  customerType: string;
  outstandingBalance: number | null;
};

export type SeedProduct = {
  id: string;
  name: string;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  totalQuantitySold: number | null;
  isDisabled?: boolean;
  isDeleted?: boolean;
};

export type BillingSeed = {
  testRunId: string;
  defaultCustomer: SeedCustomer;
  customers: {
    ravi: SeedCustomer;
    anita: SeedCustomer;
  };
  products: {
    standard: SeedProduct;
    fractional: SeedProduct;
    onePaisa: SeedProduct;
    longName: SeedProduct;
    disabled: SeedProduct;
    deleted: SeedProduct;
    largeAmount: SeedProduct;
    similarAlpha: SeedProduct;
    similarBeta: SeedProduct;
  };
};

type OnboardingResult = { customerId: string };

const onboardingPayload = {
  storeName: "Relay E2E Store",
  ownerName: "E2E Test Owner",
  phone: "9876543210",
  email: "billing-e2e@example.com",
  addressLine1: "12 Test Market Road",
  addressLine2: null,
  country: "India",
  state: "Karnataka",
  city: "Bengaluru",
  pincode: "560001",
  gstin: null
};

async function createCustomer(
  api: PublicApi,
  name: string,
  customerType: "cash" | "account",
  openingBalance?: number
): Promise<SeedCustomer> {
  return api.post<SeedCustomer>("/api/customers", {
    name,
    contact: null,
    customerType,
    ...(openingBalance === undefined ? {} : { openingBalance })
  });
}

export async function createSeedProduct(
  api: PublicApi,
  payload: {
    name: string;
    price: number;
    mrp?: number | null;
    weight?: string | null;
    unit?: string | null;
    purchasePrice?: number | null;
    isDisabled?: boolean;
  }
): Promise<SeedProduct> {
  const created = await api.post<{ id: string }>("/api/products", {
    imageUrl: null,
    weight: null,
    unit: null,
    mrp: null,
    purchasePrice: null,
    isDisabled: false,
    ...payload
  });
  return api.get<SeedProduct>(`/api/products/${created.id}`);
}

export async function seedBillingData(api: PublicApi, testRunId: string): Promise<BillingSeed> {
  const onboarding = await api.post<OnboardingResult>("/api/onboarding", onboardingPayload);
  const defaultCustomer = await api.get<SeedCustomer>("/api/customers/default");
  if (defaultCustomer.id !== onboarding.customerId) {
    throw new Error("Onboarding returned a different default customer from the public read API.");
  }

  const [ravi, anita] = await Promise.all([
    createCustomer(api, "Ravi", "cash"),
    createCustomer(api, "Anita", "account", 1250)
  ]);

  const [
    standard,
    fractional,
    onePaisa,
    longName,
    disabled,
    largeAmount,
    similarAlpha,
    similarBeta
  ] = await Promise.all([
    createSeedProduct(api, { name: "Standard Soap", price: 6800, mrp: 7500 }),
    createSeedProduct(api, {
      name: "Fractional Almonds",
      price: 12345,
      mrp: 13000,
      weight: "1",
      unit: "kg",
      purchasePrice: 10001
    }),
    createSeedProduct(api, { name: "One Paisa Sample", price: 1, mrp: 1 }),
    createSeedProduct(api, {
      name: "Extraordinary Long Product Name Used To Verify Complete Historical Snapshot Persistence",
      price: 9876,
      mrp: 11000
    }),
    createSeedProduct(api, {
      name: "Disabled Billing Product",
      price: 4400,
      isDisabled: true
    }),
    createSeedProduct(api, { name: "Large Amount Safe Product", price: 9_000_000_000 }),
    createSeedProduct(api, { name: "Masala Tea Classic", price: 3210, mrp: 3500 }),
    createSeedProduct(api, { name: "Masala Tea Clove", price: 4321, mrp: 4700 })
  ]);

  const deleted = await createSeedProduct(api, {
    name: "Deleted Billing Product",
    price: 5500
  });
  await api.post<void>(`/api/products/${deleted.id}/delete`);

  return {
    testRunId,
    defaultCustomer,
    customers: { ravi, anita },
    products: {
      standard,
      fractional,
      onePaisa,
      longName,
      disabled,
      deleted: { ...deleted, isDeleted: true },
      largeAmount,
      similarAlpha,
      similarBeta
    }
  };
}

export async function seedStressProducts(api: PublicApi, count = 200): Promise<SeedProduct[]> {
  const products: SeedProduct[] = [];
  for (let index = 1; index <= count; index += 1) {
    products.push(
      await createSeedProduct(api, {
        name: `Stress Product ${String(index).padStart(3, "0")}`,
        price: 1000 + index,
        mrp: 1200 + index
      })
    );
  }
  return products;
}
export type PersistedTransaction = {
  id: string;
  type: "sale" | "estimate";
  transactionNo: number;
  customerId: string;
  customer: SeedCustomer;
  notes: string | null;
  grandTotal: number;
  totalQuantity: number;
  isAddedToAccounting?: boolean;
  canModify?: boolean;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string | null;
    name: string;
    productSnapshot: string;
    weight: string | null;
    unit: string | null;
    mrp: number | null;
    price: number;
    quantity: number;
    checkedQty: number;
    position: number;
    totalPrice: number;
  }>;
};

export type ApiLineItemSeed = {
  product?: SeedProduct;
  name?: string;
  productSnapshot?: string;
  price?: number;
  quantity?: number;
  checkedQty?: number;
};

export async function createApiTransaction(
  api: PublicApi,
  options: {
    type: "sale" | "estimate";
    customerId: string;
    items: ApiLineItemSeed[];
    notes?: string | null;
    addToAccounting?: boolean;
    createdAt?: string;
  }
): Promise<PersistedTransaction> {
  const items = options.items.map((item, position) => ({
    id: null,
    rowId: crypto.randomUUID(),
    productId: item.product?.id ?? null,
    name: item.product?.name ?? item.name ?? "Manual Item",
    productSnapshot:
      item.product?.productSnapshot ?? item.productSnapshot ?? item.name ?? "Manual Item",
    weight: item.product?.weight ?? null,
    unit: item.product?.unit ?? null,
    mrp: item.product?.mrp ?? null,
    price: item.price ?? item.product?.price ?? 100,
    quantity: item.quantity ?? 1000,
    checkedQty: item.checkedQty ?? 0,
    position,
    isDeleted: false
  }));
  const data = {
    transactionNo: null,
    transactionType: options.type,
    customerId: options.customerId,
    notes: options.notes ?? null,
    createdAt: options.createdAt ?? new Date().toISOString(),
    items,
    ...(options.type === "sale" ? { addToAccounting: options.addToAccounting ?? false } : {})
  };
  const created = await api.post<{ billingId?: string }>(`/api/${options.type}s/create`, { data });
  if (!created.billingId) throw new Error("Public transaction setup API did not return billingId.");
  return api.get<PersistedTransaction>(`/api/${options.type}s/${created.billingId}`);
}
