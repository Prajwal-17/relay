import type { LineItem } from "@/store/lineItemsStore";
import {
  TRANSACTION_TYPE,
  UPDATE_QTY_ACTION,
  type TransactionType,
  type UpdateQtyAction
} from "@shared/types";
import { convertToPaisa, toMilliUnits } from "@shared/utils/utils";

type NormalizedLineItem = Omit<LineItem, "price" | "quantity"> & {
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
 * Normalize Line Items for Api Payload construction
 * - Do not use for zustand actions, This does not inject rowId()
 * 1. Validation - Filter out invalid LineItems using `filterValidLineItems` func
 * 2. Convert `price` string to (Paisa).
 * 3. Transform `price` & `quantity` from string to number.
 */
export function normalizeLineItems(lineItems: LineItem[]): NormalizedLineItem[] {
  const filteredLineitems = filterValidLineItems(lineItems);

  return filteredLineitems.map((item) => ({
    ...item,
    price: convertToPaisa(parseFloat(item.price || "0")),
    quantity: toMilliUnits(item.quantity)
  }));
}

/**
 * Normalize Original Line Items for comparision
 * - Do not use for zustand actions, This does not inject rowId()
 * 1. Validation - Filter out invalid original LineItems using `filterValidLineItems` func
 * 2. Convert `price` string to (Paisa).
 * 3. Transform `price` & `quantity` from string to number.
 */
export function normalizeOriginalLineItems(lineItems: LineItem[]) {
  const filteredLineitems = filterValidLineItems(lineItems);

  return filteredLineitems.map((item) => ({
    ...item,
    price: convertToPaisa(parseFloat(item.price || "0")),
    quantity: toMilliUnits(item.quantity)
  }));
}

/** Strip off `id` & `rowId` fields in an array of objects for comparision */
export function stripLineItems(originalLineItems: any[], currentLineItems: any[]) {
  /* eslint-disable */
  const stripedOriginal = originalLineItems.map(({ id, rowId, isInventoryItem, ...rest }) => rest);
  const stripedCurrent = currentLineItems.map(({ id, rowId, isInventoryItem, ...rest }) => rest);
  /* eslint-enable */

  return {
    originalCleaned: stripedOriginal,
    currentCleaned: stripedCurrent
  };
}

export function buildTransactionPayload({
  billingType,
  billingId,
  isAutoSave,
  transactionNo,
  customerId,
  items,
  createdAt
}: {
  billingType: TransactionType;
  billingId: string | null;
  isAutoSave: boolean;
  transactionNo: number | null;
  customerId: string | null;
  items: NormalizedLineItem[];
  createdAt: string;
}) {
  return {
    billingType: billingType,
    id: billingId,
    payload: {
      isAutoSave: isAutoSave,
      data: {
        transactionNo: transactionNo,
        transactionType: billingType,
        customerId,
        isPaid: billingType === TRANSACTION_TYPE.SALE,
        items,
        createdAt
      }
    }
  };
}
