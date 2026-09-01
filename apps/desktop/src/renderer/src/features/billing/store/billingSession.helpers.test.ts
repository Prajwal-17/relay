import { SYNCSTATUS } from "@/types/renderer.types";
import type { UnifiedTransactionItem } from "@shared/types";
import { describe, expect, it } from "vitest";
import {
  POSITION_GAP,
  createInitialLineItem,
  createInitialSession,
  midpointPosition,
  nextPosition,
  normalizeLineItems,
  reCalculateLineItem,
  rebalancePositions
} from "./billingSession.helpers";
import type { LineItem } from "./billingSession.types";

function calculated(price: string, quantity: string): number {
  return reCalculateLineItem({
    ...createInitialLineItem(),
    price,
    quantity
  }).totalPrice;
}

function filled(rowId: string, position: number): LineItem {
  return {
    ...createInitialLineItem(position),
    rowId,
    productSnapshot: rowId,
    name: rowId,
    price: "1",
    quantity: "1",
    totalPrice: 100,
    syncStatus: SYNCSTATUS.IS_DIRTY
  };
}

describe("billing exact calculation helpers", () => {
  it.each([
    ["0.01", "0.001", 0],
    ["0.01", "0.499", 0],
    ["0.01", "0.500", 1],
    ["0.01", "0.501", 1],
    ["10.01", "1.001", 1002],
    ["10.02", "1.234", 1236],
    ["123.45", "2.125", 26_233]
  ])("rounds ₹%s × %s with integer paisa and milli-units", (price, quantity, expected) => {
    expect(calculated(price, quantity)).toBe(expected);
  });

  it("treats empty and zero transient inputs as zero", () => {
    expect(calculated("", "")).toBe(0);
    expect(calculated("10.25", "0")).toBe(0);
    expect(calculated("0", "1.250")).toBe(0);
  });
});

describe("billing sparse position helpers", () => {
  it("creates a new session with one empty line item", () => {
    const session = createInitialSession();
    expect(session.lineItems).toHaveLength(1);
    expect(session.lineItems[0]).toMatchObject({ position: 0, productSnapshot: "" });
    expect(session.lineItems[0]?.rowId).toBeTruthy();
  });

  it("appends after the greatest position and computes integer midpoints", () => {
    const rows = [filled("a", POSITION_GAP), filled("b", POSITION_GAP * 4)];
    expect(nextPosition(rows)).toBe(POSITION_GAP * 5);
    expect(midpointPosition(POSITION_GAP, POSITION_GAP * 4)).toBe(
      Math.floor((POSITION_GAP * 5) / 2)
    );
  });

  it("rebalances in visual order with unique monotonically increasing positions", () => {
    const rows = [filled("third", 9), filled("first", 10), filled("second", 11)];
    const positions = rebalancePositions(rows);
    expect(rows.map((row) => positions.get(row.rowId))).toEqual([
      0,
      POSITION_GAP,
      POSITION_GAP * 2
    ]);
  });

  it("hydrates by persisted position and adds one trailing empty row", () => {
    const items: UnifiedTransactionItem[] = [
      persistedItem("later", POSITION_GAP * 3),
      persistedItem("earlier", POSITION_GAP)
    ];
    const hydrated = normalizeLineItems(items);

    expect(hydrated).toHaveLength(3);
    expect(hydrated.slice(0, 2).map((item) => item.productSnapshot)).toEqual(["earlier", "later"]);
    expect(hydrated.slice(0, 2).map((item) => item.position)).toEqual([
      POSITION_GAP,
      POSITION_GAP * 3
    ]);
    expect(hydrated[2]).toMatchObject({
      productSnapshot: "",
      position: POSITION_GAP * 4
    });
  });
});

function persistedItem(productSnapshot: string, position: number): UnifiedTransactionItem {
  return {
    id: crypto.randomUUID(),
    productId: crypto.randomUUID(),
    name: productSnapshot,
    productSnapshot,
    weight: null,
    unit: null,
    price: 6800,
    mrp: 7500,
    quantity: 1000,
    totalPrice: 6800,
    purchasePrice: 5000,
    checkedQty: 0,
    position
  };
}
