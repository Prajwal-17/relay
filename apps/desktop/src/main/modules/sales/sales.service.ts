import { asc, desc, type SQL } from "drizzle-orm";
import {
  SortOption,
  TRANSACTION_TYPE,
  type BatchCheckAction,
  type PaginatedApiResponse,
  type SyncResponse,
  type TransactionListResponse,
  type TxnPayloadData,
  type UnifiedTransactionItem,
  type UnifiedTransctionWithItems,
  type UpdateQtyAction
} from "../../../shared/types";
import { sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { salesRepository } from "./sales.repository";
import type { FilterSalesParams } from "./sales.types";

const getSaleById = async (id: string): Promise<UnifiedTransctionWithItems> => {
  const sale = await salesRepository.getSaleById(id);
  if (!sale) {
    throw new AppError(`Sale with id:${id} does not exist`, 400);
  }
  // eslint-disable-next-line
  const items: UnifiedTransactionItem[] = sale.saleItems.map(({ saleId, ...rest }) => ({
    ...rest,
    checkedQty: rest.checkedQty ?? 0
  }));

  return {
    type: TRANSACTION_TYPE.SALE,
    id: sale.id,
    transactionNo: sale.invoiceNo,
    customerId: sale.customerId,
    customer: sale.customer,
    grandTotal: sale.grandTotal,
    totalQuantity: sale.totalQuantity,
    isAddedToAccounting: sale.customerLedgerEntries.length > 0,
    canModify: Date.now() - new Date(sale.recordedAt).getTime() <= 48 * 60 * 60 * 1000,
    recordedAt: sale.recordedAt,
    notes: sale.notes,
    items: items,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt
  };
};

const getNextInvoiceNo = async (): Promise<{ nextNo: number }> => {
  const latestInvoice = await salesRepository.getLatestInvoiceNo();
  let nextInvoiceNo = 1;

  if (latestInvoice) {
    nextInvoiceNo = latestInvoice.invoiceNo + 1;
  }

  return {
    nextNo: nextInvoiceNo
  };
};

const filterSalesByDate = async (
  params: FilterSalesParams
): Promise<PaginatedApiResponse<TransactionListResponse>> => {
  let orderByClause: SQL;
  switch (params.sortBy) {
    case SortOption.DATE_NEWEST_FIRST:
      orderByClause = desc(sales.createdAt);
      break;
    case SortOption.DATE_OLDEST_FIRST:
      orderByClause = asc(sales.createdAt);
      break;
    case SortOption.HIGH_TO_LOW:
      orderByClause = desc(sales.grandTotal);
      break;
    case SortOption.LOW_TO_HIGH:
      orderByClause = asc(sales.grandTotal);
      break;
    default:
      orderByClause = desc(sales.createdAt);
      break;
  }

  const options = {
    from: params.from,
    to: params.to,
    orderByClause,
    pageNo: params.pageNo,
    pageSize: params.pageSize
  };

  const result = await salesRepository.filterSalesByDate(options);

  const transactions = result.transactionsResult.map((txn) => {
    return {
      type: TRANSACTION_TYPE.SALE,
      id: txn.id,
      transactionNo: txn.invoiceNo,
      customerId: txn.customerId,
      customerName: txn.customer.name,
      grandTotal: txn.grandTotal,
      totalQuantity: txn.totalQuantity,
      isAddedToAccounting: txn.customerLedgerEntries.length > 0,
      canModify: Date.now() - new Date(txn.recordedAt).getTime() <= 48 * 60 * 60 * 1000,
      recordedAt: txn.recordedAt,
      notes: txn.notes,
      updatedAt: txn.updatedAt,
      createdAt: txn.createdAt
    };
  });

  const nextpageNo = result.transactionsResult.length === 20 ? params.pageNo + 1 : null;

  const summary = result.summaryResult[0];

  return {
    nextPageNo: nextpageNo,
    totalRevenue: summary?.totalRevenue ?? 0,
    totalTransactions: summary?.totalTransactions ?? 0,
    transactions
  };
};

type SalePayloadData = Extract<TxnPayloadData, { transactionType: "sale" }>;

const createSale = async (payload: SalePayloadData): Promise<SyncResponse> => {
  const result = await salesRepository.createSale(payload);
  return result;
};

const syncSale = async (id: string, payload: SalePayloadData): Promise<SyncResponse> => {
  const existingSale = await salesRepository.getSaleById(id);

  if (!existingSale) {
    throw new AppError("Sale does not exist", 404);
  }

  const result = await salesRepository.syncSaleWithItems(id, payload);

  return result;
};

const updateCheckedQtyService = async (saleItemId: string, action: UpdateQtyAction) => {
  await salesRepository.updateCheckedQty(saleItemId, action);
};

const batchCheckItemsService = async (id: string, action: BatchCheckAction) => {
  await salesRepository.batchCheckItems(id, action);
};

const deleteSaleById = async (id: string) => {
  await salesRepository.deleteSaleById(id);
};

const duplicateSaleById = async (id: string) => {
  return await salesRepository.duplicateSaleById(id);
};

export const salesService = {
  getSaleById,
  getNextInvoiceNo,
  filterSalesByDate,
  createSale,
  syncSale,
  updateCheckedQtyService,
  batchCheckItemsService,
  deleteSaleById,
  duplicateSaleById
};
