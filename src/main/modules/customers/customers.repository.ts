import { count, desc, eq, like, sql } from "drizzle-orm";
import type { CreateCustomerPayload, UpdateCustomerPayload } from "../../../shared/types";
import { db } from "../../db/db";
import { customers, estimates, sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
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

const getCustomerSummary = async (id: string) => {
  return db.transaction((tx) => {
    const salesResult = tx
      .select({
        count: count(),
        total: sql<number>`SUM(${sales.grandTotal})`
      })
      .from(sales)
      .where(eq(sales.customerId, id))
      .get();

    const estimatesResult = tx
      .select({
        count: count(),
        total: sql<number>`SUM(${estimates.grandTotal})`
      })
      .from(estimates)
      .where(eq(estimates.customerId, id))
      .get();

    const salesCount = salesResult?.count ?? 0;
    const salesTotal = salesResult?.total ?? 0;

    const estimatesCount = estimatesResult?.count ?? 0;
    const estimatesTotal = estimatesResult?.total ?? 0;

    const totalCount = salesCount + estimatesCount;
    const totalAmount = salesTotal + estimatesTotal;

    const combinedAverage = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

    return {
      salesCount: salesResult?.count ?? 0,
      estimatesCount: estimatesResult?.count ?? 0,
      average: combinedAverage ?? 0,
      salesTotal: salesResult?.total ?? 0,
      estimatesTotal: estimatesResult?.total ?? 0
    };
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

const deleteById = async (id: string) => {
  const transactionsExist = await hasExistingTransactions(id);

  if (transactionsExist > 0) {
    throw new AppError("Cannot delete customer with existing sales or estimates.", 400);
  }

  const result = await db.delete(customers).where(eq(customers.id, id));
  return result.changes;
};

export const customersRepository = {
  findById,
  getCustomers,
  getDefaultCustomer,
  getSalesByCustomerId,
  getEstimatesByCustomerId,
  getCustomerSummary,
  createCustomer,
  updateById,
  deleteById
};
