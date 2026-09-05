import z from "zod";
import { TRANSACTION_TYPE } from "../types";

const safePositiveInteger = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const lineItemSchema = z
  .object({
    id: z.uuidv4().nullable().default(null),
    rowId: z.uuidv4(),
    productId: z.uuidv4().nullable(),
    name: z.string().trim().min(1).max(300),
    productSnapshot: z.string().trim().min(1).max(500),
    weight: z.string().nullable().default(null),
    unit: z.string().nullable().default(null),
    mrp: safePositiveInteger.nullable().default(null),
    purchasePrice: z.coerce
      .number()
      .int()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER)
      .nullable()
      .optional(),
    price: safePositiveInteger,
    quantity: safePositiveInteger,
    checkedQty: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).default(0),
    position: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).default(0),
    isDeleted: z.boolean()
  })
  .superRefine((item, context) => {
    if (item.checkedQty > item.quantity) {
      context.addIssue({
        code: "custom",
        path: ["checkedQty"],
        message: "Checked quantity cannot exceed quantity."
      });
    }

    if (
      Number.isSafeInteger(item.price) &&
      Number.isSafeInteger(item.quantity) &&
      BigInt(item.price) * BigInt(item.quantity) > BigInt(Number.MAX_SAFE_INTEGER) * 1000n
    ) {
      context.addIssue({
        code: "custom",
        path: ["price"],
        message: "The calculated line total exceeds the safe money range."
      });
    }
  });

const baseTransactionPayloadSchema = z.object({
  billingId: z.uuidv4().optional(),
  creationToken: z.uuidv4().optional(),
  transactionNo: safePositiveInteger.nullable().optional(),
  customerId: z.uuidv4(),
  items: z.array(lineItemSchema).max(500),
  notes: z.string().max(2_000).nullable().default(null),
  createdAt: z.iso.datetime().optional()
});

export const salePayloadDataSchema = baseTransactionPayloadSchema.extend({
  transactionType: z.literal(TRANSACTION_TYPE.SALE),
  addToAccounting: z.boolean()
});

export const estimatePayloadDataSchema = baseTransactionPayloadSchema.extend({
  transactionType: z.literal(TRANSACTION_TYPE.ESTIMATE)
});

export const payloadDataSchema = z.discriminatedUnion("transactionType", [
  salePayloadDataSchema,
  estimatePayloadDataSchema
]);

export const txnPayloadSchema = z.object({ data: payloadDataSchema });
export const saleTxnPayloadSchema = z.object({ data: salePayloadDataSchema });
export const estimateTxnPayloadSchema = z.object({ data: estimatePayloadDataSchema });
