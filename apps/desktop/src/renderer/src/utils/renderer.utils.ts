import type { LineItem } from "@/features/billing/store/billingSession.types";
import { SYNCSTATUS } from "@/types/renderer.types";
import {
  TRANSACTION_TYPE,
  UPDATE_QTY_ACTION,
  type TransactionType,
  type UpdateQtyAction
} from "@shared/types";
import { rupeesToPaisa } from "@shared/utils/utils";
import { toMilliUnits } from "@shared/utils/milliUnits";

type NormalizedLineItem = Omit<LineItem, "price" | "quantity" | "syncStatus" | "revision"> & {
  price: number;
  quantity: number;
};

export const updateCheckedQuantity = (
  action: UpdateQtyAction,
  totalQty: number,
  checkedQty: number
) => {
  let updatedQty = checkedQty ?? 0;
  const remainder = +(totalQty % 1).toFixed(3);

  if (action === UPDATE_QTY_ACTION.INCREMENT) {
    const nextQty = updatedQty + 1;

    if (nextQty > totalQty) {
      const adjusted = updatedQty + remainder;
      updatedQty = adjusted <= totalQty ? adjusted : totalQty;
    } else {
      updatedQty = nextQty;
    }
  }

  if (action === UPDATE_QTY_ACTION.DECREMENT) {
    const nextQty = updatedQty - 1;
    const currentFrac = +(updatedQty % 1).toFixed(3);

    if (currentFrac !== 0 && updatedQty === totalQty) {
      updatedQty = Math.floor(updatedQty);
    } else {
      updatedQty = Math.max(0, nextQty);
    }
  }

  return Math.min(Math.max(updatedQty, 0), totalQty);
};

/**
 * Return the billing row surface for unchecked, completed, and partially checked items.
 */
export const getCheckStatusColor = (checkedQty: number, quantity: number) => {
  let bgColor = "border-frame bg-card";
  if (checkedQty === quantity && quantity > 0) {
    bgColor = "border-success bg-line-item-complete";
  } else if (checkedQty > 0 && checkedQty < quantity) {
    bgColor = "border-warning bg-line-item-partial";
  }
  return bgColor;
};

export const toSentenceCase = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
};

/**
 * Filters out raw LineItems into a valid LineItems based on DB schema
 * - Must Contain -> productSnapshot, price, quantity, totalPrice
 * @param items Array of raw LineItems objects to filter
 * @returns A array of valid LineItems
 */
export const filterValidLineItems = (items: LineItem[]) => {
  return items.filter(
    (item) =>
      item.productSnapshot.trim().length > 0 &&
      parseFloat(item.price) > 0 &&
      parseFloat(item.quantity) > 0 &&
      item.totalPrice > 0
  );
};

/**
 * Filters an array of line items, returning only those marked as "dirty" & "isDeleted = true" for autosave sync
 *
 * @param items - Array of LineItems to filter
 * @returns A new array of LineItems whose `syncStatus` is "IS_DIRTY"
 */
export const filterDirtyLineItems = (items: LineItem[]) => {
  return items.filter((item) => item.syncStatus === SYNCSTATUS.IS_DIRTY || item.isDeleted);
};

/**
 * Normalize Line Items for Api Payload construction
 * 1. Convert `price` string to (Paisa).
 * 2. Transform `price` & `quantity` from string to number(milliUnits).
 * 3. Strips of `syncStatus`,
 * @param lineItems - An array of LineItems filtered through `filterDirtyLineItems`
 */
export function normalizeLineItems(lineItems: LineItem[]): NormalizedLineItem[] {
  return lineItems.map((item) => {
    // eslint-disable-next-line
    const { syncStatus, revision: _revision, ...rest } = item;

    return {
      ...rest,
      price: rupeesToPaisa(parseFloat(item.price || "0")),
      quantity: toMilliUnits(item.quantity),
      checkedQty: toMilliUnits(item.checkedQty)
    };
  });
}

export function buildTransactionPayload({
  billingType,
  transactionNo,
  customerId,
  items,
  notes,
  addToAccounting,
  createdAt
}: {
  billingType: TransactionType;
  transactionNo: number | null;
  customerId: string | null;
  items: NormalizedLineItem[];
  notes: string | null;
  addToAccounting: boolean;
  createdAt: string;
}) {
  const data = {
    transactionNo,
    transactionType: billingType,
    customerId,
    notes,
    items,
    createdAt
  };

  return {
    data:
      billingType === TRANSACTION_TYPE.SALE
        ? { ...data, transactionType: TRANSACTION_TYPE.SALE, addToAccounting }
        : { ...data, transactionType: TRANSACTION_TYPE.ESTIMATE }
  };
}
