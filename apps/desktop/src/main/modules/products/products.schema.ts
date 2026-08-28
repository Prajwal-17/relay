import z from "zod";
import { PRODUCT_FILTER, PRODUCT_SORT_BY } from "../../../shared/types";

export const productSearchSchema = z.object({
  query: z.string().default(""),
  pageNo: z.coerce.number().min(1).nonnegative().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20),
  filterType: z.enum(PRODUCT_FILTER).default(PRODUCT_FILTER.ACTIVE),
  sortBy: z
    .enum(PRODUCT_SORT_BY)
    .optional()
    .catch(undefined)
    .transform((v) => v ?? null),
  priceMin: z.coerce
    .number()
    .min(0)
    .optional()
    .catch(undefined)
    .transform((v) => v ?? null),
  priceMax: z.coerce
    .number()
    .min(0)
    .optional()
    .catch(undefined)
    .transform((v) => v ?? null),
  hasMrp: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  hasPurchasePrice: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  billingMode: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true")
});

export const productTransactionsSchema = z.object({
  pageNo: z.coerce.number().min(1).positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(10)
});
