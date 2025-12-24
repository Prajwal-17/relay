import z from "zod";
import { SortOption } from "../../../shared/types";

export const getSalesByCustomerSchema = z.object({
  customerId: z.string(),
  pageNo: z.coerce.number().min(1).positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20)
});

export const filterSalesParamsSchema = z.object({
  from: z.iso
    .datetime()
    .optional()
    .default(() => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      return from.toISOString();
    }),
  to: z.iso
    .datetime()
    .optional()
    .default(() => {
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      return to.toISOString();
    }),
  sortBy: z.enum(SortOption).default(SortOption.DATE_NEWEST_FIRST),
  pageNo: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20)
});
