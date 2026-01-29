import type z from "zod";
import type { LineItemSchema, TxnPayloadData } from "../../../shared/types";
import type { filterEstimatesParamsSchema } from "./estimates.schema";

export type FilterEstimatesParams = z.infer<typeof filterEstimatesParamsSchema>;

export type CreateEstimateParams = TxnPayloadData & {
  items: (LineItemSchema & {
    totalPrice: number;
  })[];
  grandTotal: number;
  totalQuantity: number;
};

export type UpdateEstimateParams = TxnPayloadData & {
  items: (LineItemSchema & {
    totalPrice: number;
  })[];
  grandTotal: number;
  totalQuantity: number;
};
