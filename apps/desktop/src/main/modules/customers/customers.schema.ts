import z from "zod";
import { CUSTOMER_SORT_BY, CUSTOMER_TXN_SORT, CUSTOMER_TYPE } from "../../../shared/types";

export const listCustomersSchema = z.object({
  pageNo: z.coerce.number().min(1).positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20),
  query: z.string().trim().default(""),
  type: z
    .enum([CUSTOMER_TYPE.ALL, CUSTOMER_TYPE.CASH, CUSTOMER_TYPE.ACCOUNT, CUSTOMER_TYPE.HOTEL])
    .default(CUSTOMER_TYPE.ALL),
  sort: z
    .enum([
      CUSTOMER_SORT_BY.NAME_ASC,
      CUSTOMER_SORT_BY.NAME_DESC,
      CUSTOMER_SORT_BY.NEWEST,
      CUSTOMER_SORT_BY.OLDEST
    ])
    .default(CUSTOMER_SORT_BY.NAME_ASC),
  includeArchived: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true")
});

export const getSalesByCustomerSchema = z.object({
  pageNo: z.coerce.number().min(1).positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().default(""),
  sort: z
    .enum([
      CUSTOMER_TXN_SORT.DATE_DESC,
      CUSTOMER_TXN_SORT.DATE_ASC,
      CUSTOMER_TXN_SORT.AMOUNT_DESC,
      CUSTOMER_TXN_SORT.AMOUNT_ASC
    ])
    .default(CUSTOMER_TXN_SORT.DATE_DESC)
});

export const getEstimatesByCustomerSchema = getSalesByCustomerSchema;

export const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
