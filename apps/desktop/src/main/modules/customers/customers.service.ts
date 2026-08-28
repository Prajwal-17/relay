import { eq, type SQL } from "drizzle-orm";
import {
  CUSTOMER_TYPE,
  TRANSACTION_TYPE,
  type ActivityEvent,
  type CreateCustomerPayload,
  type Customer,
  type CustomerSummary,
  type CustomerTransaction,
  type PaginatedApiResponse,
  type RecentSalePreview,
  type UpdateCustomerPayload
} from "../../../shared/types";
import { CustomerRole } from "../../db/enum";
import { customers } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { customersRepository } from "./customers.repository";
import type {
  ActivityParams,
  EstimatesByCustomerParams,
  ListCustomersParams,
  RecentSalesParams,
  SalesByCustomerParams
} from "./customers.types";

const findById = async (id: string): Promise<Customer> => {
  const customer = await customersRepository.findById(id);

  if (!customer) {
    throw new AppError(`Customer with ID ${id} not found`, 404);
  }

  return customer;
};

const getCustomers = async (searchTerm: string): Promise<Customer[]> => {
  const customerResult = await customersRepository.getCustomers(searchTerm);
  return customerResult;
};

const getCustomersPaginated = async (
  params: ListCustomersParams
): Promise<PaginatedApiResponse<{ data: Customer[] }>> => {
  let whereClause: SQL | undefined = undefined;

  if (params.type !== CUSTOMER_TYPE.ALL) {
    const role =
      params.type === CUSTOMER_TYPE.CASH
        ? CustomerRole.CASH
        : params.type === CUSTOMER_TYPE.ACCOUNT
          ? CustomerRole.ACCOUNT
          : CustomerRole.HOTEL;
    whereClause = eq(customers.customerType, role);
  }

  const offset = (params.pageNo - 1) * params.pageSize;

  const [rows, totalCount] = await Promise.all([
    customersRepository.getCustomersPaginated({
      searchTerm: params.query,
      whereClause,
      sort: params.sort,
      limit: params.pageSize,
      offset,
      includeArchived: params.includeArchived
    }),
    customersRepository.countCustomers({
      searchTerm: params.query,
      whereClause,
      includeArchived: params.includeArchived
    })
  ]);

  const nextPageNo = params.pageNo * params.pageSize < totalCount ? params.pageNo + 1 : null;

  if (rows.length === 0) {
    return { nextPageNo, totalCount, data: [] };
  }

  const customerIds = rows.map((r) => r.id);

  const [lastSales, lastPayments] = await Promise.all([
    customersRepository.getLastSalesForCustomers(customerIds),
    customersRepository.getLastPaymentsForCustomers(customerIds)
  ]);

  const purchaseByCustomer = new Map<string, { createdAt: string; grandTotal: number | null }>();
  for (const s of lastSales) {
    if (!purchaseByCustomer.has(s.customerId)) {
      purchaseByCustomer.set(s.customerId, { createdAt: s.createdAt, grandTotal: s.grandTotal });
    }
  }

  const paymentByCustomer = new Map<string, { createdAt: string; amountPaid: number | null }>();
  for (const p of lastPayments) {
    if (!paymentByCustomer.has(p.customerId)) {
      paymentByCustomer.set(p.customerId, { createdAt: p.createdAt, amountPaid: p.amountPaid });
    }
  }

  const data = rows.map((row) => {
    const purchase = purchaseByCustomer.get(row.id);
    const payment = paymentByCustomer.get(row.id);
    return {
      ...row,
      lastPurchaseAt: purchase?.createdAt ?? null,
      lastPurchaseAmt: purchase?.grandTotal ?? null,
      lastPaymentAt: payment?.createdAt ?? null,
      lastPaymentAmt: payment?.amountPaid ?? null
    };
  });

  return {
    nextPageNo,
    totalCount,
    data
  };
};

const getDefaultCustomer = async (): Promise<Customer> => {
  const customerResult = await customersRepository.getDefaultCustomer();

  if (!customerResult) {
    throw new AppError("Could not find DEFAULT customer", 404);
  }

  return customerResult;
};

const getSalesByCustomerId = async (
  params: SalesByCustomerParams
): Promise<PaginatedApiResponse<{ data: CustomerTransaction[] | [] }>> => {
  await findById(params.customerId);
  const [rows, totalCount] = await Promise.all([
    customersRepository.getSalesByCustomerId(params),
    customersRepository.countSalesByCustomerId(params)
  ]);

  const nextPageNo = params.pageNo * params.pageSize < totalCount ? params.pageNo + 1 : null;

  return {
    nextPageNo,
    totalCount,
    data:
      rows.length > 0
        ? rows.map((s) => ({
            type: TRANSACTION_TYPE.SALE,
            id: s.id,
            transactionNo: s.invoiceNo,
            customerId: s.customerId,
            grandTotal: s.grandTotal,
            totalQuantity: s.totalQuantity,
            recordedAt: s.recordedAt,
            canModify: Date.now() - new Date(s.recordedAt).getTime() <= 48 * 60 * 60 * 1000,
            notes: s.notes,
            updatedAt: s.updatedAt,
            createdAt: s.createdAt
          }))
        : []
  };
};

const getEstimatesByCustomerId = async (
  params: EstimatesByCustomerParams
): Promise<PaginatedApiResponse<{ data: CustomerTransaction[] | [] }>> => {
  await findById(params.customerId);
  const [rows, totalCount] = await Promise.all([
    customersRepository.getEstimatesByCustomerId(params),
    customersRepository.countEstimatesByCustomerId(params)
  ]);

  const nextPageNo = params.pageNo * params.pageSize < totalCount ? params.pageNo + 1 : null;

  return {
    nextPageNo,
    totalCount,
    data:
      rows.length > 0
        ? rows.map((e) => ({
            type: TRANSACTION_TYPE.ESTIMATE,
            id: e.id,
            transactionNo: e.estimateNo,
            customerId: e.customerId,
            grandTotal: e.grandTotal,
            totalQuantity: e.totalQuantity,
            notes: e.notes,
            updatedAt: e.updatedAt,
            createdAt: e.createdAt
          }))
        : []
  };
};

const getCustomerSummary = async (id: string): Promise<CustomerSummary> => {
  await findById(id);
  const result = await customersRepository.getCustomerSummary(id);
  return result;
};

const getCustomerActivity = async (params: ActivityParams): Promise<ActivityEvent[]> => {
  await findById(params.customerId);
  return customersRepository.getCustomerActivity(params);
};

const getRecentSales = async (params: RecentSalesParams): Promise<RecentSalePreview[]> => {
  await findById(params.customerId);
  return customersRepository.getRecentSales(params);
};

const createCustomer = async (payload: CreateCustomerPayload): Promise<Customer> => {
  const customer = await customersRepository.createCustomer(payload);

  if (!customer) {
    throw new AppError("Failed to create customer", 500);
  }

  return customer;
};

const updateCustomerById = async (
  customerId: string,
  payload: Partial<UpdateCustomerPayload>
): Promise<Customer> => {
  const existingCustomer = await customersRepository.findById(customerId);

  if (!existingCustomer) {
    throw new AppError("Customer does not exist", 404);
  }

  const updatedCustomer = await customersRepository.updateById(customerId, payload);
  if (!updatedCustomer) {
    throw new AppError("Failed to update customer", 400);
  }

  return updatedCustomer;
};

const archiveCustomerById = async (id: string): Promise<void> => {
  await findById(id);

  const changes = await customersRepository.archiveById(id);

  if (changes <= 0) {
    throw new AppError("Could not archive Customer", 400);
  }
};

const restoreCustomerById = async (id: string): Promise<void> => {
  await findById(id);

  const changes = await customersRepository.restoreById(id);

  if (changes <= 0) {
    throw new AppError("Could not restore Customer", 400);
  }
};

const deleteCustomerById = async (id: string): Promise<void> => {
  const changes = await customersRepository.deleteById(id);

  if (changes <= 0) {
    throw new AppError("Could not delete Customer", 400);
  }
};

export const customersService = {
  findById,
  getCustomers,
  getCustomersPaginated,
  getDefaultCustomer,
  getSalesByCustomerId,
  getEstimatesByCustomerId,
  getCustomerSummary,
  getCustomerActivity,
  getRecentSales,
  createCustomer,
  updateCustomerById,
  archiveCustomerById,
  restoreCustomerById,
  deleteCustomerById
};
