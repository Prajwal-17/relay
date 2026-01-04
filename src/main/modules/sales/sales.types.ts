import type z from "zod";
import type { LineItemSchema, TxnPayloadData } from "../../../shared/types";
import type { filterSalesParamsSchema } from "./sales.schema";

export type PaginatedQuery = {
  pageNo: number;
  pageSize: number;
};

export type SalesByCustomerParams = PaginatedQuery & {
  customerId: string;
};

export type FilterSalesParams = z.infer<typeof filterSalesParamsSchema>;

export type CreateSaleParams = TxnPayloadData & {
  items: (LineItemSchema & {
    totalPrice: number;
  })[];
  grandTotal: number;
  totalQuantity: number;
};

export type UpdateSaleParams = TxnPayloadData & {
  items: (LineItemSchema & {
    totalPrice: number;
  })[];
  grandTotal: number;
  totalQuantity: number;
};
