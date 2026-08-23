import { PRODUCT_SORT_BY, type Product } from "@shared/types";
import { beforeEach, describe, expect, it } from "vitest";
import { useSearchDropdownStore } from "./searchDropdown.store";

function result(name: string): Product {
  return {
    id: crypto.randomUUID(),
    name,
    productSnapshot: name,
    imageUrl: null,
    weight: null,
    unit: null,
    mrp: 7500,
    price: 6800,
    purchasePrice: 5000,
    totalQuantitySold: 0
  };
}

beforeEach(() => {
  useSearchDropdownStore.getState().reset();
});

describe("billing product-search state", () => {
  it("replaces results for a new response and appends only pagination responses", () => {
    const first = result("First");
    const second = result("Second");
    const latest = result("Latest");
    useSearchDropdownStore.getState().setAvailableProducts("replace", [first]);
    useSearchDropdownStore.getState().setAvailableProducts("append", [second]);
    expect(useSearchDropdownStore.getState().availableProducts).toEqual([first, second]);

    useSearchDropdownStore.getState().setAvailableProducts("replace", [latest]);
    expect(useSearchDropdownStore.getState().availableProducts).toEqual([latest]);
  });

  it("clears row-specific sorting when a different billing row becomes active", () => {
    const store = useSearchDropdownStore.getState();
    store.setActiveRowId("row-a");
    store.setSortBy(PRODUCT_SORT_BY.PRICE_LOW_HIGH);
    store.setActiveRowId("row-a");
    expect(useSearchDropdownStore.getState().sortBy).toBe(PRODUCT_SORT_BY.PRICE_LOW_HIGH);

    store.setActiveRowId("row-b");
    expect(useSearchDropdownStore.getState().sortBy).toBeNull();
  });

  it("reset closes the dropdown and removes query, results, active row, and sort", () => {
    const store = useSearchDropdownStore.getState();
    store.setItemQuery("Masala");
    store.setAvailableProducts("replace", [result("Masala Tea")]);
    store.setActiveRowId("row-a");
    store.setIsDropdownOpen(true);
    store.setSortBy(PRODUCT_SORT_BY.NAME_ASC);
    store.reset();

    expect(useSearchDropdownStore.getState()).toMatchObject({
      itemQuery: "",
      availableProducts: [],
      activeRowId: null,
      isDropdownOpen: false,
      sortBy: null
    });
  });
});
