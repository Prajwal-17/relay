import { describe, expect, it } from "vitest";
import { UPDATE_QTY_ACTION, type UpdateQtyAction } from "../../../../shared/types";
import { updateCheckedQuantityUtil } from "../../../utils/product.utils";

describe("updateCheckedQuantityUtil", () => {
  it("increments whole and fractional quantities without exceeding the total", () => {
    expect(updateCheckedQuantityUtil(UPDATE_QTY_ACTION.INCREMENT, 3, 0)).toBe(1);
    expect(updateCheckedQuantityUtil(UPDATE_QTY_ACTION.INCREMENT, 2.5, 2)).toBe(2.5);
    expect(updateCheckedQuantityUtil(UPDATE_QTY_ACTION.INCREMENT, 2.5, 2.5)).toBe(2.5);
  });

  it("decrements whole quantities and removes a final fractional remainder", () => {
    expect(updateCheckedQuantityUtil(UPDATE_QTY_ACTION.DECREMENT, 3, 2)).toBe(1);
    expect(updateCheckedQuantityUtil(UPDATE_QTY_ACTION.DECREMENT, 2.5, 2.5)).toBe(2);
    expect(updateCheckedQuantityUtil(UPDATE_QTY_ACTION.DECREMENT, 0.5, 0.5)).toBe(0);
  });

  it("clamps defensive runtime input to the valid quantity range", () => {
    const unsupportedAction = "unsupported" as UpdateQtyAction;

    expect(updateCheckedQuantityUtil(unsupportedAction, 2, -1)).toBe(0);
    expect(updateCheckedQuantityUtil(unsupportedAction, 2, 3)).toBe(2);
  });
});
