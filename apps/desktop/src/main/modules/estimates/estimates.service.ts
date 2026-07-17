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
import { estimates } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { estimatesRepository } from "./estimates.repository";
import type { FilterEstimatesParams } from "./estimates.types";

const getEstimateById = async (id: string): Promise<UnifiedTransctionWithItems> => {
  const estimate = await estimatesRepository.getEstimateById(id);
  if (!estimate) {
    throw new AppError(`Estimate with id:${id} does not exist`, 400);
  }
  // eslint-disable-next-line
  const items: UnifiedTransactionItem[] = estimate.estimateItems.map(({ estimateId, ...rest }) => ({
    ...rest,
    checkedQty: rest.checkedQty ?? 0
  }));

  return {
    type: TRANSACTION_TYPE.ESTIMATE,
    id: estimate.id,
    transactionNo: estimate.estimateNo,
    customerId: estimate.customerId,
    customer: estimate.customer,
    grandTotal: estimate.grandTotal,
    totalQuantity: estimate.totalQuantity,
    amountPaid: 0,
    paymentMode: null,
    isPaid: estimate.isPaid,
    notes: estimate.notes,
    items: items,
    createdAt: estimate.createdAt,
    updatedAt: estimate.updatedAt
  };
};

const getNextEstimateNo = async (): Promise<{ nextNo: number }> => {
  const latestEstimateNo = await estimatesRepository.getLatestEstimateNo();
  let nextEstimateNo = 1;

  if (latestEstimateNo) {
    nextEstimateNo = latestEstimateNo.estimateNo + 1;
  }

  return {
    nextNo: nextEstimateNo
  };
};

const filterEstimateByDate = async (
  params: FilterEstimatesParams
): Promise<PaginatedApiResponse<TransactionListResponse>> => {
  let orderByClause: SQL;
  switch (params.sortBy) {
    case SortOption.DATE_NEWEST_FIRST:
      orderByClause = desc(estimates.createdAt);
      break;
    case SortOption.DATE_OLDEST_FIRST:
      orderByClause = asc(estimates.createdAt);
      break;
    case SortOption.HIGH_TO_LOW:
      orderByClause = desc(estimates.grandTotal);
      break;
    case SortOption.LOW_TO_HIGH:
      orderByClause = asc(estimates.grandTotal);
      break;
    default:
      orderByClause = desc(estimates.createdAt);
      break;
  }

  const options = {
    from: params.from,
    to: params.to,
    orderByClause,
    pageNo: params.pageNo,
    pageSize: params.pageSize
  };

  const result = await estimatesRepository.filterEstimatesByDate(options);

  const transactions = result.transactionsResult.map((txn) => {
    return {
      type: TRANSACTION_TYPE.ESTIMATE,
      id: txn.id,
      transactionNo: txn.estimateNo,
      customerId: txn.customerId,
      customerName: txn.customer.name,
      grandTotal: txn.grandTotal,
      totalQuantity: txn.totalQuantity,
      amountPaid: 0,
      paymentMode: null,
      isPaid: txn.isPaid,
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

const createEstimate = async (payload: TxnPayloadData): Promise<SyncResponse> => {
  const result = await estimatesRepository.createEstimate(payload);
  return result;
};

const syncEstimate = async (id: string, payload: TxnPayloadData): Promise<SyncResponse> => {
  const existingEstimate = await estimatesRepository.getEstimateById(id);

  if (!existingEstimate) {
    throw new AppError("Estimate does not exist", 404);
  }

  const result = await estimatesRepository.syncEstimateWithItems(id, payload);

  return result;
};

const convertEstimateToSale = async (id: string): Promise<{ id: string }> => {
  const result = await estimatesRepository.convertEstimateToSale(id);
  return {
    id: result.id
  };
};

const updateCheckedQtyService = async (estimateItemId: string, action: UpdateQtyAction) => {
  await estimatesRepository.updateCheckedQty(estimateItemId, action);
};

const batchCheckItemsService = async (id: string, action: BatchCheckAction) => {
  await estimatesRepository.batchCheckItems(id, action);
};

const updateEstimateStatus = async (id: string, isPaid: boolean): Promise<{ message: string }> => {
  const result = await estimatesRepository.updateEstimateStatus(id, isPaid);
  if (result.changes > 0) {
    return {
      message: isPaid ? "Estimate marked as paid" : "Estimate marked as unpaid"
    };
  } else {
    return {
      message: isPaid ? "Estimate already marked as paid" : "Estimate already marked as unpaid"
    };
  }
};

const deleteEstimateById = async (id: string) => {
  await estimatesRepository.deleteEstimateById(id);
};

const duplicateEstimateById = async (id: string) => {
  return await estimatesRepository.duplicateEstimateById(id);
};

export const estimatesService = {
  getEstimateById,
  getNextEstimateNo,
  filterEstimateByDate,
  createEstimate,
  syncEstimate,
  convertEstimateToSale,
  updateCheckedQtyService,
  batchCheckItemsService,
  updateEstimateStatus,
  deleteEstimateById,
  duplicateEstimateById
};
