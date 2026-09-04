import { beforeEach, describe, expect, it } from "vitest";
import { useProductsStore } from "./products.store";

describe("products dialog state", () => {
  beforeEach(() => {
    useProductsStore.setState({ openProductDialog: false });
  });

  it("uses idempotent open and close assignments", () => {
    const { setOpenProductDialog } = useProductsStore.getState();

    setOpenProductDialog(true);
    setOpenProductDialog(true);
    expect(useProductsStore.getState().openProductDialog).toBe(true);

    setOpenProductDialog(false);
    setOpenProductDialog(false);
    expect(useProductsStore.getState().openProductDialog).toBe(false);
  });
});
