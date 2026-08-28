import { and, asc, count, desc, eq, inArray, like, sql, type SQL } from "drizzle-orm";
import {
  ACTIVITY_KIND,
  CUSTOMER_SORT_BY,
  CUSTOMER_TXN_SORT,
  LEDGER_ENTRY_TYPE,
  type ActivityEvent,
  type CreateCustomerPayload,
  type CustomerSortByType,
  type RecentSalePreview,
  type UpdateCustomerPayload
} from "../../../shared/types";
import { formatRupee } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { CustomerRole } from "../../db/enum";
import { customerLedger, customers, estimates, sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { ledgerRepository } from "../ledger/ledger.repository";
import type { EstimatesByCustomerParams, SalesByCustomerParams } from "./customers.types";
import { buildEstimatesWhere, buildSalesWhere, mapLedgerEvent } from "./customers.utils";

const findById = async (id: string) => {
  return db.select().from(customers).where(eq(customers.id, id)).get();
};

const getCustomers = async (searchTerm: string) => {
  if (searchTerm === "") {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.isArchived, false))
      .orderBy(customers.name);
  }

  const searchQuery = `${searchTerm}%`;
  return await db
    .select()
    .from(customers)
    .where(and(like(customers.name, searchQuery), eq(customers.isArchived, false)))
    .orderBy(customers.name);
};

const columns = {
  id: customers.id,
  storeId: customers.storeId,
  name: customers.name,
  contact: customers.contact,
  customerType: customers.customerType,
  notes: customers.notes,
  address: customers.address,
  outstandingBalance: customers.outstandingBalance,
  isArchived: customers.isArchived,
  archivedAt: customers.archivedAt,
  createdAt: customers.createdAt,
  updatedAt: customers.updatedAt
};

const getCustomersPaginated = async (params: {
  searchTerm: string;
  whereClause: SQL | undefined;
  sort: CustomerSortByType;
  limit: number;
  offset: number;
  includeArchived: boolean;
}) => {
  const sortClause: SQL =
    params.sort === CUSTOMER_SORT_BY.NAME_DESC
      ? desc(customers.name)
      : params.sort === CUSTOMER_SORT_BY.NEWEST
        ? desc(customers.createdAt)
        : params.sort === CUSTOMER_SORT_BY.OLDEST
          ? asc(customers.createdAt)
          : asc(customers.name);

  const buildWhere = (baseWhere: SQL | undefined): SQL | undefined => {
    if (params.includeArchived) {
      return baseWhere;
    }
    const archivedClause = eq(customers.isArchived, false);
    return baseWhere ? and(baseWhere, archivedClause) : archivedClause;
  };

  if (params.searchTerm === "") {
    const query = db.select(columns).from(customers).orderBy(sortClause);
    const where = buildWhere(params.whereClause);
    if (where) {
      return query.where(where).limit(params.limit).offset(params.offset);
    }
    return query.limit(params.limit).offset(params.offset);
  }

  const searchClause = like(customers.name, `${params.searchTerm}%`);
  const baseWhere = params.whereClause ? and(searchClause, params.whereClause) : searchClause;
  const where = buildWhere(baseWhere);

  if (where) {
    return db
      .select(columns)
      .from(customers)
      .where(where)
      .orderBy(sortClause)
      .limit(params.limit)
      .offset(params.offset);
  }
  return db
    .select(columns)
    .from(customers)
    .where(baseWhere)
    .orderBy(sortClause)
    .limit(params.limit)
    .offset(params.offset);
};

const getLastSalesForCustomers = (customerIds: string[]) => {
  return db
    .select({
      customerId: sales.customerId,
      createdAt: sales.createdAt,
      grandTotal: sales.grandTotal
    })
    .from(sales)
    .where(inArray(sales.customerId, customerIds))
    .orderBy(desc(sales.createdAt))
    .all();
};

const getLastPaymentsForCustomers = (customerIds: string[]) => {
  return db
    .select({
      customerId: customerLedger.customerId,
      createdAt: customerLedger.createdAt,
      amountPaid: customerLedger.amountPaid
    })
    .from(customerLedger)
    .where(and(inArray(customerLedger.customerId, customerIds), eq(customerLedger.type, "payment")))
    .orderBy(desc(customerLedger.createdAt))
    .all();
};

const countCustomers = async (params: {
  searchTerm: string;
  whereClause: SQL | undefined;
  includeArchived: boolean;
}) => {
  const buildWhere = (baseWhere: SQL | undefined): SQL | undefined => {
    if (params.includeArchived) {
      return baseWhere;
    }
    const archivedClause = eq(customers.isArchived, false);
    return baseWhere ? and(baseWhere, archivedClause) : archivedClause;
  };

  if (params.searchTerm === "") {
    const where = buildWhere(params.whereClause);
    const query = db.select({ count: count() }).from(customers);
    const result = where ? query.where(where).get() : query.get();
    return result?.count ?? 0;
  }

  const searchClause = like(customers.name, `${params.searchTerm}%`);
  const baseWhere = params.whereClause ? and(searchClause, params.whereClause) : searchClause;
  const where = buildWhere(baseWhere);

  if (where) {
    const result = db.select({ count: count() }).from(customers).where(where).get();
    return result?.count ?? 0;
  }
  const result = db.select({ count: count() }).from(customers).where(baseWhere).get();
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

const getRecentSales = async (params: {
  customerId: string;
  limit: number;
}): Promise<RecentSalePreview[]> => {
  return db
    .select({
      id: sales.id,
      invoiceNo: sales.invoiceNo,
      grandTotal: sales.grandTotal,
      createdAt: sales.createdAt
    })
    .from(sales)
    .where(eq(sales.customerId, params.customerId))
    .orderBy(desc(sales.createdAt), desc(sales.invoiceNo))
    .limit(params.limit)
    .all()
    .map((row) => ({
      id: row.id,
      invoiceNo: row.invoiceNo,
      grandTotal: row.grandTotal ?? 0,
      createdAt: row.createdAt
    }));
};

const getCustomerActivity = async (params: {
  customerId: string;
  limit: number;
}): Promise<ActivityEvent[]> => {
  const recentSales = db
    .select({
      id: sales.id,
      invoiceNo: sales.invoiceNo,
      grandTotal: sales.grandTotal,
      createdAt: sales.createdAt
    })
    .from(sales)
    .where(eq(sales.customerId, params.customerId))
    .orderBy(desc(sales.createdAt), desc(sales.invoiceNo))
    .limit(params.limit)
    .all();

  const recentEstimates = db
    .select({
      id: estimates.id,
      estimateNo: estimates.estimateNo,
      grandTotal: estimates.grandTotal,
      createdAt: estimates.createdAt
    })
    .from(estimates)
    .where(eq(estimates.customerId, params.customerId))
    .orderBy(desc(estimates.createdAt), desc(estimates.estimateNo))
    .limit(params.limit)
    .all();

  const ledgerTypes = [
    LEDGER_ENTRY_TYPE.PAYMENT,
    LEDGER_ENTRY_TYPE.ADJUSTMENT,
    LEDGER_ENTRY_TYPE.QUICK_SALE,
    LEDGER_ENTRY_TYPE.OPENING_BALANCE
  ];
  const recentLedger = db
    .select({
      id: customerLedger.id,
      type: customerLedger.type,
      amountDue: customerLedger.amountDue,
      amountPaid: customerLedger.amountPaid,
      paymentMode: customerLedger.paymentMode,
      notes: customerLedger.notes,
      createdAt: customerLedger.createdAt
    })
    .from(customerLedger)
    .where(
      and(
        eq(customerLedger.customerId, params.customerId),
        inArray(customerLedger.type, ledgerTypes)
      )
    )
    .orderBy(desc(customerLedger.createdAt), desc(customerLedger.id))
    .limit(params.limit)
    .all();

  const saleEvents: ActivityEvent[] = recentSales.map((s) => ({
    id: `sale:${s.id}`,
    date: s.createdAt,
    kind: ACTIVITY_KIND.SALE,
    title: "Sale recorded",
    description: `Invoice #${s.invoiceNo} for ${formatRupee(s.grandTotal ?? 0)}`
  }));

  const estimateEvents: ActivityEvent[] = recentEstimates.map((e) => ({
    id: `estimate:${e.id}`,
    date: e.createdAt,
    kind: ACTIVITY_KIND.ESTIMATE,
    title: "Estimate created",
    description: `Estimate #${e.estimateNo} for ${formatRupee(e.grandTotal ?? 0)}`
  }));

  const ledgerEvents: ActivityEvent[] = recentLedger.map((l) => mapLedgerEvent(l));

  return [...saleEvents, ...estimateEvents, ...ledgerEvents]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? 1 : -1))
    .slice(0, params.limit);
};

const createCustomer = async (payload: CreateCustomerPayload) => {
  return db.transaction((tx) => {
    const { openingBalance, ...customerData } = payload;
    const customer = tx.insert(customers).values(customerData).returning().get();

    if (customer && openingBalance && openingBalance > 0) {
      ledgerRepository.insertOpeningBalance(tx, customer.id, { amount: openingBalance });
      ledgerRepository.recomputeOutstanding(tx, customer.id);
      return tx.select().from(customers).where(eq(customers.id, customer.id)).get();
    }

    return customer;
  });
};

const updateById = async (customerId: string, payload: Partial<UpdateCustomerPayload>) => {
  if (payload.name !== undefined) {
    const existing = await findById(customerId);
    if (existing?.name === "DEFAULT") {
      throw new AppError("Cannot rename the DEFAULT customer", 400);
    }
  }

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

    const existingLedger = tx
      .select()
      .from(customerLedger)
      .where(eq(customerLedger.customerId, customerId))
      .limit(1)
      .all();

    return existingSales.length || existingEstimates.length || existingLedger.length;
  });
};

const archiveById = async (id: string) => {
  const customer = await findById(id);
  if (customer?.name === "DEFAULT") {
    throw new AppError("Cannot archive the DEFAULT customer", 400);
  }

  const result = await db
    .update(customers)
    .set({ isArchived: true, archivedAt: sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
    .where(eq(customers.id, id));

  return result.changes;
};

const restoreById = async (id: string) => {
  const result = await db
    .update(customers)
    .set({ isArchived: false, archivedAt: null })
    .where(eq(customers.id, id));

  return result.changes;
};

const deleteById = async (id: string) => {
  const customer = await findById(id);
  if (customer?.name === "DEFAULT") {
    throw new AppError("Cannot delete the DEFAULT customer", 400);
  }

  const transactionsExist = await hasExistingTransactions(id);

  if (transactionsExist > 0) {
    throw new AppError(
      "Cannot delete customer with existing sales, estimates, or ledger entries. Archive them instead.",
      400
    );
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
  getRecentSales,
  getCustomerActivity,
  createCustomer,
  updateById,
  archiveById,
  restoreById,
  deleteById,
  getLastSalesForCustomers,
  getLastPaymentsForCustomers
};
