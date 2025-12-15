import { eq } from "drizzle-orm";
import type { CreateCustomerPayload, UpdateCustomerPayload } from "../../../shared/types";
import { db } from "../../db/db";
import { customers, estimates, sales } from "../../db/schema";

const findById = async (id: string) => {
  return db.select().from(customers).where(eq(customers.id, id)).get();
};

const createCustomers = async (payload: CreateCustomerPayload) => {
  return db.insert(customers).values(payload).returning().get();
};

const updateById = async (customerId: string, payload: Partial<UpdateCustomerPayload>) => {
  return db
    .update(customers)
    .set({ ...payload })
    .where(eq(customers.id, customerId))
    .returning()
    .get();
};

const deleteById = async (id: string) => {
  return await db.delete(customers).where(eq(customers.id, id));
};

const hasExistingTransactions = async (customerId: string) => {
  return db.transaction((tx) => {
    const existingSales = tx
      .select()
      .from(sales)
      .where(eq(sales.customerId, customerId))
      .limit(1)
      .all();

    const existingEstimates = tx
      .select()
      .from(estimates)
      .where(eq(estimates.customerId, customerId))
      .limit(1)
      .all();

    return existingSales.length || existingEstimates.length;
  });
};

export const customersRepository = {
  findById,
  createCustomers,
  updateById,
  deleteById,
  hasExistingTransactions
};
