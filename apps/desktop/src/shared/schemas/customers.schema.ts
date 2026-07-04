import z from "zod";
import { CustomerRole } from "../../main/db/enum";
import { CustomerSchema } from "./base.schema";

export const createCustomerSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  customerType: z.enum(CustomerRole).default(CustomerRole.CASH)
});

export const updateCustomerSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  customerType: z.enum(CustomerRole).optional()
});

export const dirtyFieldsCustomerSchema = updateCustomerSchema.partial();
