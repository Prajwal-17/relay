import z from "zod";
import { CUSTOMER_TYPE } from "../../../shared/types";

export const listCustomersSchema = z.object({
  pageNo: z.coerce.number().min(1).positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20),
  query: z.string().trim().default(""),
  type: z
    .enum([CUSTOMER_TYPE.ALL, CUSTOMER_TYPE.CASH, CUSTOMER_TYPE.ACCOUNT, CUSTOMER_TYPE.HOTEL])
    .default(CUSTOMER_TYPE.ALL)
});

export const getSalesByCustomerSchema = z.object({
  pageNo: z.coerce.number().min(1).positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20)
});

export const getEstimatesByCustomerSchema = getSalesByCustomerSchema;
