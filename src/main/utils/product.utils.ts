import { ignoredWeight } from "../../shared/constants";
import { UPDATE_QTY_ACTION, type UpdateQtyAction } from "../../shared/types";

type SnapshotPayload = {
  name: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
};

export const generateProductSnapshot = (item: SnapshotPayload) => {
  let name = item.name;

  // weight && mrp && weight+unit does not equal to ignoredWeights
  if (
    item.weight !== null &&
    item.mrp &&
    !ignoredWeight.some((w) => `${item.weight}${item.unit}` === w)
  ) {
    name += ` ${item.weight}${item.unit}`;
    if (item.mrp) {
      name += ` ${item.mrp}Rs`;
    }
  }

  // weight && mrp && weight+unit equal to ignoredWeights
  if (
    item.weight !== null &&
    item.mrp &&
    ignoredWeight.some((w) => `${item.weight}${item.unit}` === w)
  ) {
    if (item.mrp) {
      name += ` ${item.mrp}Rs`;
    }
  }

  // weight = null && mrp
  if (item.weight === null && item.mrp) {
    name += ` ${item.mrp}Rs`;
  }

  // weight && mrp = null
  if (item.weight !== null && !item.mrp) {
    name += ` ${item.weight}${item.unit}`;
  }

  return name;
};

export const updateCheckedQuantityUtil = (
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
