import { ignoredWeight } from "../../shared/constants";

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
