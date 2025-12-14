import z from "zod";
import { PRODUCT_FILTER } from "../../../shared/types";

export const productSearchSchema = z.object({
  query: z.string().default(" "),
  pageNo: z.coerce.number().min(1).nonnegative().default(1),
  pageSize: z.coerce.number().nonnegative().max(100).default(20),
  filterType: z.enum(PRODUCT_FILTER).default(PRODUCT_FILTER.ACTIVE)
});
