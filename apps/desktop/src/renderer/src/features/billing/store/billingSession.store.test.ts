import { SYNCSTATUS } from "@/types/renderer.types";
import type { BillingProductDTO } from "@shared/types";
import { beforeEach, describe, expect, it } from "vitest";
import { POSITION_GAP } from "./billingSession.helpers";
import { useBillingSessionStore } from "./billingSession.store";

const tabId = "billing-store-test";

function product(name: string, price = 6800): BillingProductDTO {
  return {
    id: crypto.randomUUID(),
    name,
    productSnapshot: `${name} snapshot`,
    weight: null,
    unit: null,
    mrp: price + 500,
    price,
    purchasePrice: price - 1000
  };
}

function session() {
  return useBillingSessionStore.getState().sessions[tabId]!;
}

beforeEach(() => {
  useBillingSessionStore.setState({ sessions: {} });
  useBillingSessionStore.getState().initSession(tabId);
});

describe("billing session row state", () => {
  it("starts with five rows and Add Row appends exactly one without changing totals", () => {
    expect(session().lineItems).toHaveLength(5);
    expect(session().lineItems.reduce((total, row) => total + row.totalPrice, 0)).toBe(0);

    useBillingSessionStore.getState().addEmptyLineItem(tabId, "button");
    expect(session().lineItems).toHaveLength(6);
    expect(session().lineItems.at(-1)?.position).toBe(POSITION_GAP * 5);
    expect(session().lineItems.reduce((total, row) => total + row.totalPrice, 0)).toBe(0);
  });

  it("keeps two selections of the same product as separate rows", () => {
    const selected = product("Separate Duplicate");
    const [first, second] = session().lineItems;
    useBillingSessionStore.getState().addLineItem(tabId, first!.rowId, selected);
    useBillingSessionStore.getState().addLineItem(tabId, second!.rowId, selected);

    const filled = session().lineItems.filter((row) => row.productId === selected.id);
    expect(filled).toHaveLength(2);
    expect(new Set(filled.map((row) => row.rowId)).size).toBe(2);
    expect(filled.map((row) => row.totalPrice)).toEqual([6800, 6800]);
  });

  it("recalculates exact money while checked state never changes monetary totals", () => {
    const rowId = session().lineItems[0]!.rowId;
    useBillingSessionStore.getState().addLineItem(tabId, rowId, product("Fractional", 12_345));
    useBillingSessionStore.getState().updateLineItem(tabId, rowId, "quantity", "1.234");
    const before = session().lineItems[0]!.totalPrice;
    expect(before).toBe(15_234);

    useBillingSessionStore.getState().updateLineItem(tabId, rowId, "checkedQty", 0.75);
    expect(session().lineItems[0]).toMatchObject({
      checkedQty: 0.75,
      totalPrice: before
    });
  });

  it("clamps checked quantity when total quantity is reduced", () => {
    const rowId = session().lineItems[0]!.rowId;
    useBillingSessionStore.getState().addLineItem(tabId, rowId, product("Clamp"));
    useBillingSessionStore.getState().updateLineItem(tabId, rowId, "quantity", "3.500");
    useBillingSessionStore.getState().updateLineItem(tabId, rowId, "checkedQty", 3.25);
    useBillingSessionStore.getState().updateLineItem(tabId, rowId, "quantity", "1.250");

    expect(session().lineItems[0]!.checkedQty).toBe(1.25);
  });

  it("Check All and Uncheck All affect valid live items only", () => {
    const [liveRow, deletedRow, emptyRow] = session().lineItems;
    useBillingSessionStore.getState().addLineItem(tabId, liveRow!.rowId, product("Live"));
    useBillingSessionStore.getState().addLineItem(tabId, deletedRow!.rowId, product("Deleted"));
    useBillingSessionStore.getState().deleteLineItem(tabId, deletedRow!.rowId);

    useBillingSessionStore.getState().setAllChecked(tabId, true);
    expect(session().lineItems.find((row) => row.rowId === liveRow!.rowId)?.checkedQty).toBe(1);
    expect(session().lineItems.find((row) => row.rowId === deletedRow!.rowId)?.checkedQty).toBe(0);
    expect(session().lineItems.find((row) => row.rowId === emptyRow!.rowId)).toMatchObject({
      checkedQty: 0,
      syncStatus: SYNCSTATUS.SYNCED
    });

    useBillingSessionStore.getState().setAllChecked(tabId, false);
    expect(session().lineItems.find((row) => row.rowId === liveRow!.rowId)?.checkedQty).toBe(0);
  });

  it("reorders filled rows with unique monotonically increasing positions", () => {
    const rows = session().lineItems.slice(0, 3);
    rows.forEach((row, index) =>
      useBillingSessionStore
        .getState()
        .addLineItem(tabId, row.rowId, product(["First", "Second", "Third"][index]!))
    );
    useBillingSessionStore.getState().reorderLineItems(tabId, rows[2]!.rowId, rows[0]!.rowId);

    const filled = session().lineItems.filter(
      (row) => row.productSnapshot !== "" && !row.isDeleted
    );
    expect(filled.map((row) => row.name)).toEqual(["Third", "First", "Second"]);
    const positions = filled.map((row) => row.position);
    expect(new Set(positions).size).toBe(3);
    expect(
      positions.every((position, index) => index === 0 || position > positions[index - 1]!)
    ).toBe(true);
  });

  it("marks only requested unsaved rows as saving", () => {
    const rows = session().lineItems.slice(0, 2);
    useBillingSessionStore.getState().addLineItem(tabId, rows[0]!.rowId, product("First"));
    useBillingSessionStore.getState().addLineItem(tabId, rows[1]!.rowId, product("Second"));

    const firstRow = session().lineItems[0]!;
    useBillingSessionStore
      .getState()
      .markItemsAsSaving(tabId, new Map([[firstRow.rowId, firstRow.revision]]));
    expect(session().lineItems[0]!.syncStatus).toBe(SYNCSTATUS.SAVING);
    expect(session().lineItems[1]!.syncStatus).toBe(SYNCSTATUS.IS_DIRTY);
  });

  it("does not acknowledge pending notes when default-customer hydration arrives later", () => {
    useBillingSessionStore
      .getState()
      .updatePersistentField(tabId, "notes", "Notes typed before customer hydration");
    const revisionBeforeHydration = session().metadataRevision;
    const persistedBeforeHydration = session().persistedMetadataRevision;
    const customerId = crypto.randomUUID();

    useBillingSessionStore.getState().hydrateSession(tabId, {
      customerId,
      customerName: "Default Customer"
    });

    expect.soft(session().persistedMetadataRevision).toBe(persistedBeforeHydration);
    expect.soft(session().metadataRevision).toBeGreaterThan(session().persistedMetadataRevision);
    expect.soft(session()).toMatchObject({
      notes: "Notes typed before customer hydration",
      customerId,
      metadataRevision: revisionBeforeHydration
    });
  });
});
