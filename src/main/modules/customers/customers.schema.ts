import z from "zod";

export const getSalesByCustomerSchema = z.object({
  customerId: z.string(),
  pageNo: z.coerce.number().min(1).positive().default(1),
  pageSize: z.coerce.number().positive().max(100).default(20)
});

export const getEstimatesByCustomerSchema = getSalesByCustomerSchema;
