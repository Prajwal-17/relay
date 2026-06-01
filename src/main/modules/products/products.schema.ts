import z from "zod";
import { PRODUCT_FILTER, PRODUCT_SORT_BY } from "../../../shared/types";

export const productSearchSchema = z.object({
  query: z.string().default(" "),
  pageNo: z.coerce.number().min(1).nonnegative().default(1),
  pageSize: z.coerce.number().nonnegative().max(100).default(20),
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
  hasMrp: z.coerce
    .boolean()
    .optional()
    .catch(false)
    .transform((v) => v ?? false),
  hasPurchasePrice: z.coerce
    .boolean()
    .optional()
    .catch(false)
    .transform((v) => v ?? false),
  billingMode: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true")
    .catch(false)
});
