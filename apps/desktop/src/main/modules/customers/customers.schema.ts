import z from "zod";
import { CUSTOMER_SORT_BY, CUSTOMER_TYPE } from "../../../shared/types";

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
    .default(CUSTOMER_SORT_BY.NAME_ASC)
});

export const getSalesByCustomerSchema = z.object({
  pageNo: z.coerce.number().min(1).positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20)
});

export const getEstimatesByCustomerSchema = getSalesByCustomerSchema;
