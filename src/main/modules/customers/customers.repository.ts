import { desc, eq, like } from "drizzle-orm";
import type { CreateCustomerPayload, UpdateCustomerPayload } from "../../../shared/types";
import { db } from "../../db/db";
import { customers, estimates, sales } from "../../db/schema";
import type { EstimatesByCustomerParams, SalesByCustomerParams } from "./customers.types";

const findById = async (id: string) => {
  return db.select().from(customers).where(eq(customers.id, id)).get();
};

const getCustomers = async (searchTerm: string) => {
  if (searchTerm === "") {
    return await db
      .select({
        id: customers.id,
        name: customers.name,
        contact: customers.contact,
        customerType: customers.customerType,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt
      })
      .from(customers)
      .orderBy(customers.name);
  }

  const searchQuery = `${searchTerm}%`;
  return await db
    .select({
      id: customers.id,
      name: customers.name,
      contact: customers.contact,
      customerType: customers.customerType,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt
    })
    .from(customers)
    .where(like(customers.name, searchQuery))
    .orderBy(customers.name);
};

const getDefaultCustomer = async () => {
  return db.select().from(customers).where(like(customers.name, "DEFAULT")).get();
};

const getSalesByCustomerId = async (params: SalesByCustomerParams) => {
  const offset = (params.pageNo - 1) * params.pageSize;

  return await db.query.sales.findMany({
    where: eq(sales.customerId, params.customerId),
    orderBy: desc(sales.createdAt),
    limit: 20,
    offset: offset
  });
};

const getEstimatesByCustomerId = async (params: EstimatesByCustomerParams) => {
  const offset = (params.pageNo - 1) * params.pageSize;

  return await db.query.estimates.findMany({
    where: eq(estimates.customerId, params.customerId),
    orderBy: desc(estimates.createdAt),
    limit: 20,
    offset: offset
  });
};

const createCustomer = async (payload: CreateCustomerPayload) => {
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
  getCustomers,
  getDefaultCustomer,
  getSalesByCustomerId,
  getEstimatesByCustomerId,
  createCustomer,
  updateById,
  deleteById,
  hasExistingTransactions
};
