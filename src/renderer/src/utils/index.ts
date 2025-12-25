import { UPDATE_QTY_ACTION, type UpdateQtyAction } from "@shared/types";

export const updateCheckedQuantity = (
  action: UpdateQtyAction,
  totalQty: number,
  checkedQty: number
) => {
  let updatedQty = checkedQty ?? 0;
  const remainder = +(totalQty % 1).toFixed(2);

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
    const currentFrac = +(updatedQty % 1).toFixed(2);

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
