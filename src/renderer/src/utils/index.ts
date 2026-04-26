import type { LineItem } from "@/store/lineItemsStore";
import { SYNCSTATUS } from "@/types";
import {
  TRANSACTION_TYPE,
  UPDATE_QTY_ACTION,
  type TransactionType,
  type UpdateQtyAction
} from "@shared/types";
import { convertToPaisa, toMilliUnits } from "@shared/utils/utils";

type NormalizedLineItem = Omit<LineItem, "price" | "quantity" | "syncStatus"> & {
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
 * To be get status color of LineItem in Billing Page(light orange, green or white)
 * @returns tailwind color class
 */
export const getCheckStatusColor = (checkedQty: number, quantity: number) => {
  let bgColor = "bg-background";
  if (checkedQty === quantity && quantity > 0) {
    bgColor = "bg-success/25";
  } else if (checkedQty > 0 && checkedQty < quantity) {
    bgColor = "bg-[oklch(0.8618_0.2317_65.9)]/20";
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
    const { syncStatus, ...rest } = item;

    return {
      ...rest,
      price: convertToPaisa(parseFloat(item.price || "0")),
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
  createdAt
}: {
  billingType: TransactionType;
  transactionNo: number | null;
  customerId: string | null;
  items: NormalizedLineItem[];
  createdAt: string;
}) {
  return {
    data: {
      transactionNo: transactionNo,
      transactionType: billingType,
      customerId,
      isPaid: billingType === TRANSACTION_TYPE.SALE,
      items,
      createdAt
    }
  };
}
