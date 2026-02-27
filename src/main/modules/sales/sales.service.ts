import { asc, desc, type SQL } from "drizzle-orm";
import {
  SortOption,
  TRANSACTION_TYPE,
  type BatchCheckAction,
  type PaginatedApiResponse,
  type TransactionListResponse,
  type TxnPayloadData,
  type UnifiedTransactionItem,
  type UnifiedTransctionWithItems,
  type UpdateQtyAction,
  type UpdateSaleResponse
} from "../../../shared/types";
import { sales } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { salesRepository } from "./sales.repository";
import type { FilterSalesParams, UpdateSaleParams } from "./sales.types";

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
    isPaid: sale.isPaid,
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
      isPaid: txn.isPaid,
      updatedAt: txn.updatedAt,
      createdAt: txn.createdAt
    };
  });

  const nextpageNo = result.transactionsResult.length === 20 ? params.pageNo + 1 : null;

  return {
    nextPageNo: nextpageNo,
    totalRevenue: result.summaryResult[0].totalRevenue,
    totalTransactions: result.summaryResult[0].totalTransactions,
    transactions
  };
};

const computeItemsAndTotals = (items: TxnPayloadData["items"]) => {
  const finalItems = items.map((item) => {
    const total = Math.round((item.price * item.quantity) / 1000);
    return {
      ...item,
      totalPrice: total
    };
  });

  const grandTotal = finalItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const totalQuantity = finalItems.reduce((sum, item) => sum + item.quantity, 0);

  return { finalItems, grandTotal, totalQuantity };
};

const createSale = async (payload: TxnPayloadData): Promise<{ id: string }> => {
  const { finalItems, grandTotal, totalQuantity } = computeItemsAndTotals(payload.items);

  const finalPayload = {
    ...payload,
    items: finalItems,
    grandTotal,
    totalQuantity
  };

  const newSaleId = await salesRepository.createSale(finalPayload);

  return { id: newSaleId };
};

const updateSale = async (id: string, payload: TxnPayloadData): Promise<UpdateSaleResponse> => {
  const { finalItems, grandTotal, totalQuantity } = computeItemsAndTotals(payload.items);

  const finalPayload: UpdateSaleParams = {
    ...payload,
    items: finalItems,
    grandTotal,
    totalQuantity
  };

  const result = await salesRepository.updateSale(id, finalPayload);

  return {
    id,
    type: TRANSACTION_TYPE.SALE,
    ...result,
    createdAt: result.createdAt
  };
};

const convertSaleToEstimate = async (id: string): Promise<{ id: string }> => {
  const result = await salesRepository.convertSaleToEstimate(id);
  return {
    id: result.id
  };
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

export const salesService = {
  getSaleById,
  getNextInvoiceNo,
  filterSalesByDate,
  createSale,
  updateSale,
  convertSaleToEstimate,
  updateCheckedQtyService,
  batchCheckItemsService,
  deleteSaleById
};
