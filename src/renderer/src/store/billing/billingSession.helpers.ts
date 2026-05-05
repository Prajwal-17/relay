import { SYNCSTATUS } from "@/types";
import { BILLSTATUS, TRANSACTION_TYPE, type UnifiedTransactionItem } from "@shared/types";
import { convertToPaisa, convertToRupees, fromMilliUnits, toMilliUnits } from "@shared/utils/utils";
import { v4 as uuidv4 } from "uuid";
import type { LineItem } from "./billingSession.types";

export const createInitialSession = () => {
  return {
    isMetaDataDirty: false,
    billingId: null,
    billingType: TRANSACTION_TYPE.SALE,
    transactionNo: null,
    billingDate: new Date(),
    customerId: null,
    customerName: "",
    isNewCustomer: true,
    status: BILLSTATUS.IDLE,
    isCountColumnVisible: false,
    lineItems: [createInitialLineItem()]
  };
};

export function createInitialLineItem() {
  const lineItem: LineItem = {
    id: null,
    rowId: uuidv4(),
    productId: null,
    name: "",
    productSnapshot: "",
    weight: null,
    unit: null,
    mrp: null,
    price: "",
    quantity: "",
    totalPrice: 0,
    checkedQty: 0,
    isInventoryItem: false,
    syncStatus: SYNCSTATUS.SYNCED,
    isDeleted: false
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
    price: item.price ? convertToRupees(Number(item.price)).toString() : "",
    quantity: fromMilliUnits(item.quantity).toString(),
    totalPrice: item.totalPrice,
    checkedQty: fromMilliUnits(item.checkedQty),
    isInventoryItem: item.productId ? true : false,
    syncStatus: SYNCSTATUS.SYNCED,
    isDeleted: false
  }));

  return [...lineItemsArray, createInitialLineItem()];
}

export const reCalculateLineItem = (item: LineItem): LineItem => {
  const priceInRupees = parseFloat(item.price) || 0;
  const qtyInUnits = parseFloat(item.quantity) || 0;
  const priceInPaisa = convertToPaisa(priceInRupees);
  const qtyInMilli = toMilliUnits(qtyInUnits);
  const totalPrice = Math.round((priceInPaisa * qtyInMilli) / 1000);
  return {
    ...item,
    totalPrice: totalPrice
  };
};
