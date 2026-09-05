import { SYNCSTATUS } from "@/types/renderer.types";
import { BILLSTATUS, TRANSACTION_TYPE, type UnifiedTransactionItem } from "@shared/types";
import { fromMilliUnits, toMilliUnits } from "@shared/utils/milliUnits";
import { paisaToRupees, rupeesToPaisa } from "@shared/utils/utils";
import { v4 as uuidv4 } from "uuid";
import type { BillingSessionData, LineItem } from "./billingSession.types";

export const POSITION_GAP = 65536;
export const MIN_GAP = 1;

/**
 * Returns the next position after the highest existing position, or GAP if empty.
 * Works on all items (filled + empty) since empty rows always have the highest positions.
 */
export function nextPosition(lineItems: LineItem[]): number {
  if (lineItems.length === 0) return POSITION_GAP;
  return Math.max(...lineItems.map((i) => i.position)) + POSITION_GAP;
}

/** Compute the midpoint between two positions. */
export function midpointPosition(prevPos: number, nextPos: number): number {
  return Math.floor((prevPos + nextPos) / 2);
}

/**
 * Reassign every item to `i * GAP` based on current visual order.
 * Returns a map of rowId → new position.
 */
export function rebalancePositions(lineItems: LineItem[]): Map<string, number> {
  const result = new Map<string, number>();
  lineItems.forEach((item, i) => {
    result.set(item.rowId, i * POSITION_GAP);
  });
  return result;
}

export const createInitialSession = (): BillingSessionData => {
  return {
    metadataRevision: 0,
    persistedMetadataRevision: 0,
    creationBillingId: uuidv4(),
    creationToken: uuidv4(),
    billingId: null,
    billingType: TRANSACTION_TYPE.SALE,
    transactionNo: null,
    billingDate: new Date(),
    customerId: null,
    customerName: "",
    isNewCustomer: true,
    status: BILLSTATUS.IDLE,
    isCountColumnVisible: false,
    notes: null,
    addToAccounting: false,
    printOptions: {
      includeUpiQr: null,
      includeAmountInUpiQr: null,
      selectedUpiQrProfileId: null,
      includeAccountSummary: false,
      accountSummaryStartedAt: Date.now()
    },
    lineItems: [createInitialLineItem()]
  };
};

export function createInitialLineItem(position = 0) {
  const lineItem: LineItem = {
    id: null,
    rowId: uuidv4(),
    productId: null,
    name: "",
    productSnapshot: "",
    weight: null,
    unit: null,
    mrp: null,
    purchasePrice: null,
    price: "",
    quantity: "",
    totalPrice: 0,
    checkedQty: 0,
    position,
    isInventoryItem: false,
    syncStatus: SYNCSTATUS.SYNCED,
    isDeleted: false,
    revision: 0
  };

  return lineItem;
}

export function normalizeLineItems(itemsArray: UnifiedTransactionItem[]) {
  if (!itemsArray || itemsArray.length === 0) {
    return [createInitialLineItem()];
  }

  const lineItemsArray: LineItem[] = itemsArray.map((item) => ({
    id: item.id,
    rowId: uuidv4(),
    productId: item.productId,
    name: item.name,
    productSnapshot: item.productSnapshot,
    weight: item.weight,
    unit: item.unit,
    mrp: item.mrp,
    purchasePrice: item.purchasePrice,
    price: item.price ? paisaToRupees(Number(item.price)).toString() : "",
    quantity: fromMilliUnits(item.quantity).toString(),
    totalPrice: item.totalPrice,
    checkedQty: fromMilliUnits(item.checkedQty),
    position: item.position,
    isInventoryItem: item.productId ? true : false,
    syncStatus: SYNCSTATUS.SYNCED,
    isDeleted: false,
    revision: 0
  }));

  lineItemsArray.sort((a, b) => a.position - b.position);

  const emptyPosition = nextPosition(lineItemsArray);
  return [...lineItemsArray, createInitialLineItem(emptyPosition)];
}

export const reCalculateLineItem = (item: LineItem): LineItem => {
  const priceInRupees = parseFloat(item.price) || 0;
  const qtyInUnits = parseFloat(item.quantity) || 0;
  const priceInPaisa = rupeesToPaisa(priceInRupees);
  const qtyInMilli = toMilliUnits(qtyInUnits);
  const totalPrice = Math.round((priceInPaisa * qtyInMilli) / 1000);
  return {
    ...item,
    totalPrice: totalPrice
  };
};
