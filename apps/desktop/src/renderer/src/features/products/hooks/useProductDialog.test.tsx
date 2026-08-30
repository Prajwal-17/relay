// @vitest-environment jsdom

import { createAppQueryClient } from "@/lib/queryClient";
import { useProductsStore } from "@/features/products/products.store";
import { ACTION_TYPE } from "@shared/types";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useProductDialog } from "./useProductDialog";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={createAppQueryClient()}>{children}</QueryClientProvider>
);

beforeEach(() => {
  const store = useProductsStore.getState();
  store.setFormDataState({});
  store.setFormDataState({
    name: "Arabica Coffee",
    weight: "500",
    unit: "g",
    price: "399",
    imageUrl: null
  });
  store.setDirtyFields({});
  store.setErrors({});
  store.setActionType(ACTION_TYPE.EDIT);
});

afterEach(cleanup);

describe("product measurement editing", () => {
  it("preserves the selected unit and reports an error when weight is cleared", async () => {
    const { result } = renderHook(() => useProductDialog(), { wrapper });

    act(() => result.current.handleInputChange("weight", ""));

    expect(useProductsStore.getState()).toMatchObject({
      formDataState: { weight: "", unit: "g" },
      dirtyFields: { weight: "" },
      errors: { weight: "Enter a weight or set Unit to none" }
    });

    await act(async () => result.current.handleSubmit(ACTION_TYPE.EDIT));

    expect(useProductsStore.getState().errors).toMatchObject({
      weight: "Enter a weight or set Unit to none"
    });
  });

  it("preserves the weight and reports an error when the unit is cleared", () => {
    const { result } = renderHook(() => useProductDialog(), { wrapper });

    act(() => result.current.handleInputChange("unit", "none"));

    expect(useProductsStore.getState()).toMatchObject({
      formDataState: { weight: "500", unit: "none" },
      dirtyFields: { unit: "none" },
      errors: { unit: "Select a unit or clear the weight" }
    });
  });
});
