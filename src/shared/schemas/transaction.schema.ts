import z from "zod";
import { TRANSACTION_TYPE } from "../types";

export const lineItemSchema = z.object({
  id: z.uuidv4().nullable().default(null),
  rowId: z.uuidv4(),
  productId: z.uuidv4().nullable(),
  name: z.string().trim(),
  productSnapshot: z.string().trim(),
  weight: z.string().nullable().default(null),
  unit: z.string().nullable().default(null),
  mrp: z.number().int().positive().nullable().default(null),
  price: z.coerce.number().int().positive().min(1),
  purchasePrice: z.number().int().positive().nullable().default(null),
  quantity: z.coerce.number().positive().gt(0),
  checkedQty: z.number().nonnegative().default(0),
  isInventoryItem: z.boolean()
});

export const payloadDataSchema = z.object({
  transactionNo: z.number().positive(),
  transactionType: z.enum(TRANSACTION_TYPE),
  customerId: z.uuidv4(),
  isPaid: z.boolean(),
  items: z.array(lineItemSchema),
  createdAt: z.iso.datetime().optional()
});

export const txnPayloadSchema = z.object({
  isAutoSave: z.boolean(),
  data: payloadDataSchema
});
