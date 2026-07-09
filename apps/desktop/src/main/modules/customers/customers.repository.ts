import { and, asc, count, desc, eq, like, sql, type SQL } from "drizzle-orm";
import {
  CUSTOMER_SORT_BY,
  type CreateCustomerPayload,
  type CustomerSortByType,
  type UpdateCustomerPayload
} from "../../../shared/types";
import { db } from "../../db/db";
import { CustomerRole } from "../../db/enum";
import { customers, estimates, sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { CUSTOMER_TXN_SORT } from "../../../shared/types";
import type { EstimatesByCustomerParams, SalesByCustomerParams } from "./customers.types";
import { buildEstimatesWhere, buildSalesWhere } from "./customers.utils";

const findById = async (id: string) => {
  return db.select().from(customers).where(eq(customers.id, id)).get();
};

const getCustomers = async (searchTerm: string) => {
  if (searchTerm === "") {
    return await db.select().from(customers).orderBy(customers.name);
  }

  const searchQuery = `${searchTerm}%`;
  return await db
    .select()
    .from(customers)
    .where(like(customers.name, searchQuery))
    .orderBy(customers.name);
};

const getCustomersPaginated = async (params: {
  searchTerm: string;
  whereClause: SQL | undefined;
  sort: CustomerSortByType;
  limit: number;
  offset: number;
}) => {
  const sortClause: SQL =
    params.sort === CUSTOMER_SORT_BY.NAME_DESC
      ? desc(customers.name)
      : params.sort === CUSTOMER_SORT_BY.NEWEST
        ? desc(customers.createdAt)
        : params.sort === CUSTOMER_SORT_BY.OLDEST
          ? asc(customers.createdAt)
          : asc(customers.name);

  if (params.searchTerm === "") {
    const query = db.select().from(customers).orderBy(sortClause);
    if (params.whereClause) {
      return query.where(params.whereClause).limit(params.limit).offset(params.offset);
    }
    return query.limit(params.limit).offset(params.offset);
  }

  const where = params.whereClause
    ? and(like(customers.name, `${params.searchTerm}%`), params.whereClause)
    : like(customers.name, `${params.searchTerm}%`);

  return db
    .select()
    .from(customers)
    .where(where)
    .orderBy(sortClause)
    .limit(params.limit)
    .offset(params.offset);
};

const countCustomers = async (params: { searchTerm: string; whereClause: SQL | undefined }) => {
  if (params.searchTerm === "") {
    const query = db.select({ count: count() }).from(customers);
    const result = params.whereClause ? query.where(params.whereClause).get() : query.get();
    return result?.count ?? 0;
  }

  const where = params.whereClause
    ? and(like(customers.name, `${params.searchTerm}%`), params.whereClause)
    : like(customers.name, `${params.searchTerm}%`);

  const result = db.select({ count: count() }).from(customers).where(where).get();
  return result?.count ?? 0;
};

const getDefaultCustomer = async () => {
  return db.select().from(customers).where(like(customers.name, "DEFAULT")).get();
};

const createDefaultCustomer = (storeId: string, tx: any) => {
  return tx
    .insert(customers)
    .values({
      name: "DEFAULT",
      storeId: storeId,
      customerType: CustomerRole.CASH
    })
    .returning()
    .get();
};

const getSalesByCustomerId = async (params: SalesByCustomerParams) => {
  const offset = (params.pageNo - 1) * params.pageSize;

  const sortClause: SQL =
    params.sort === CUSTOMER_TXN_SORT.DATE_ASC
      ? asc(sales.createdAt)
      : params.sort === CUSTOMER_TXN_SORT.AMOUNT_DESC
        ? desc(sales.grandTotal)
        : params.sort === CUSTOMER_TXN_SORT.AMOUNT_ASC
          ? asc(sales.grandTotal)
          : desc(sales.createdAt);

  return await db.query.sales.findMany({
    where: buildSalesWhere(params),
    orderBy: sortClause,
    limit: params.pageSize,
    offset: offset
  });
};

const countSalesByCustomerId = async (params: SalesByCustomerParams) => {
  const result = db.select({ count: count() }).from(sales).where(buildSalesWhere(params)).get();
  return result?.count ?? 0;
};

const getEstimatesByCustomerId = async (params: EstimatesByCustomerParams) => {
  const offset = (params.pageNo - 1) * params.pageSize;

  const sortClause: SQL =
    params.sort === CUSTOMER_TXN_SORT.DATE_ASC
      ? asc(estimates.createdAt)
      : params.sort === CUSTOMER_TXN_SORT.AMOUNT_DESC
        ? desc(estimates.grandTotal)
        : params.sort === CUSTOMER_TXN_SORT.AMOUNT_ASC
          ? asc(estimates.grandTotal)
          : desc(estimates.createdAt);

  return await db.query.estimates.findMany({
    where: buildEstimatesWhere(params),
    orderBy: sortClause,
    limit: params.pageSize,
    offset: offset
  });
};

const countEstimatesByCustomerId = async (params: EstimatesByCustomerParams) => {
  const result = db
    .select({ count: count() })
    .from(estimates)
    .where(buildEstimatesWhere(params))
    .get();
  return result?.count ?? 0;
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
  getCustomersPaginated,
  countCustomers,
  getDefaultCustomer,
  createDefaultCustomer,
  getSalesByCustomerId,
  countSalesByCustomerId,
  getEstimatesByCustomerId,
  countEstimatesByCustomerId,
  getCustomerSummary,
  createCustomer,
  updateById,
  deleteById
};
