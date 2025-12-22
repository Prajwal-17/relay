import z from "zod";

export const getSalesByCustomerSchema = z.object({
  customerId: z.string(),
  pageNo: z.coerce.number().min(1).nonnegative().default(1),
  pageSize: z.coerce.number().nonnegative().max(100).default(20)
});
