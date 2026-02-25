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
  type UpdateEstimateResponse,
  type UpdateQtyAction
} from "../../../shared/types";
import { estimates } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { estimatesRepository } from "./estimates.repository";
import type { FilterEstimatesParams, UpdateEstimateParams } from "./estimates.types";

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
    isPaid: estimate.isPaid,
    items: items,
    createdAt: estimate.createdAt,
    updatedAt: estimate.updatedAt
  };
};

const getNextEstimateNo = async (): Promise<{ nextEstimateNo: number }> => {
  const latestEstimateNo = await estimatesRepository.getLatestEstimateNo();
  let nextEstimateNo = 1;

  if (latestEstimateNo) {
    nextEstimateNo = latestEstimateNo.estimateNo + 1;
  }

  return {
    nextEstimateNo: nextEstimateNo
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

const createEstimate = async (payload: TxnPayloadData): Promise<{ id: string }> => {
  const { finalItems, grandTotal, totalQuantity } = computeItemsAndTotals(payload.items);

  const finalPayload = {
    ...payload,
    items: finalItems,
    grandTotal,
    totalQuantity
  };

  const newEstimateId = await estimatesRepository.createEstimate(finalPayload);

  return { id: newEstimateId };
};

const updateEstimate = async (
  id: string,
  payload: TxnPayloadData
): Promise<UpdateEstimateResponse> => {
  const { finalItems, grandTotal, totalQuantity } = computeItemsAndTotals(payload.items);

  const finalPayload: UpdateEstimateParams = {
    ...payload,
    items: finalItems,
    grandTotal,
    totalQuantity
  };

  const result = await estimatesRepository.updateEstimate(id, finalPayload);

  return {
    id,
    type: TRANSACTION_TYPE.ESTIMATE,
    ...result,
    createdAt: result.createdAt
  };
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

const deleteEstimateById = async (id: string) => {
  await estimatesRepository.deleteEstimateById(id);
};

export const estimatesService = {
  getEstimateById,
  getNextEstimateNo,
  filterEstimateByDate,
  createEstimate,
  updateEstimate,
  convertEstimateToSale,
  updateCheckedQtyService,
  batchCheckItemsService,
  deleteEstimateById
};
