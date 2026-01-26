import { asc, desc, type SQL } from "drizzle-orm";
import {
  BATCH_CHECK_ACTION,
  SortOption,
  TRANSACTION_TYPE,
  type ApiResponse,
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
import { estimatesRepository } from "./estimates.repository";
import type { FilterEstimatesParams, UpdateEstimateParams } from "./estimates.types";

const getEstimateById = async (id: string): Promise<ApiResponse<UnifiedTransctionWithItems>> => {
  try {
    const estimate = await estimatesRepository.getEstimateById(id);

    if (!estimate) {
      return {
        status: "error",
        error: {
          message: `Estimate with id ${id} does not exist.`
        }
      };
    }

    const items: UnifiedTransactionItem[] = estimate.estimateItems.map(
      // eslint-disable-next-line
      ({ estimateId, ...rest }) => ({
        ...rest,
        checkedQty: rest.checkedQty ?? 0
      })
    );

    return {
      status: "success",
      data: {
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
      }
    };
  } catch (error) {
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while fetching estimate"
      }
    };
  }
};

const getNextEstimateNo = async (): Promise<ApiResponse<number>> => {
  try {
    const latestEstimateNo = await estimatesRepository.getLatestEstimateNo();
    let nextEstimateNo = 1;

    if (latestEstimateNo) {
      nextEstimateNo = latestEstimateNo.estimateNo + 1;
    }

    return {
      status: "success",
      data: nextEstimateNo
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong"
      }
    };
  }
};

const filterEstimateByDate = async (
  params: FilterEstimatesParams
): Promise<PaginatedApiResponse<TransactionListResponse>> => {
  try {
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
      status: "success",
      nextPageNo: nextpageNo,
      data: {
        totalRevenue: result.summaryResult[0].totalRevenue,
        totalTransactions: result.summaryResult[0].totalTransactions,
        transactions
      }
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong"
      }
    };
  }
};

const createEstimate = async (payload: TxnPayloadData): Promise<ApiResponse<{ id: string }>> => {
  try {
    const finalItems = payload.items.map((item) => {
      const rawTotal = item.price * item.quantity;
      return {
        ...item,
        totalPrice: Math.round(rawTotal)
      };
    });

    const total = finalItems.reduce((sum, currentItem) => {
      return sum + Number(currentItem.totalPrice || 0);
    }, 0);

    const totalQuantity = finalItems.reduce((sum, currentItem) => {
      return sum + (Number(currentItem.quantity) || 0);
    }, 0);

    const finalPayload = {
      ...payload,
      items: finalItems,
      grandTotal: total,
      totalQuantity: totalQuantity
    };

    const newEstimate = await estimatesRepository.createEstimate(finalPayload);

    return {
      status: "success",
      data: {
        id: newEstimate
      }
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while creating estimate"
      }
    };
  }
};

const updateEstimate = async (
  id: string,
  payload: TxnPayloadData
): Promise<ApiResponse<UpdateEstimateResponse>> => {
  try {
    const finalItems = payload.items.map((item) => {
      const rawTotal = item.price * item.quantity;
      return {
        ...item,
        totalPrice: Math.round(rawTotal)
      };
    });

    const total =
      finalItems.length > 0
        ? finalItems.reduce((sum, currentItem) => {
            return sum + Number(currentItem.totalPrice || 0);
          }, 0)
        : 0;

    const totalQuantity =
      finalItems.length > 0
        ? finalItems.reduce((sum, currentItem) => {
            return sum + (Number(currentItem.quantity) || 0);
          }, 0)
        : 0;

    const finalPayload: UpdateEstimateParams = {
      ...payload,
      items: finalItems,
      grandTotal: total,
      totalQuantity: totalQuantity
    };

    const result = await estimatesRepository.updateEstimate(id, finalPayload);

    return {
      status: "success",
      data: {
        id,
        type: TRANSACTION_TYPE.ESTIMATE,
        ...result
      }
    };
  } catch (error) {
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while updating estimate"
      }
    };
  }
};

const convertEstimateToSale = async (id: string): Promise<ApiResponse<string>> => {
  try {
    const result = await estimatesRepository.convertEstimateToSale(id);

    if (result.changes === 0) {
      return {
        status: "error",
        error: {
          message: `Could not convert Estimate To Sale having id: ${id}`
        }
      };
    }

    return {
      status: "success",
      data: `Successfully converted Estimate To Sale having id:${id}`
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong"
      }
    };
  }
};

const updateCheckedQtyService = async (
  estimateItemId: string,
  action: UpdateQtyAction
): Promise<ApiResponse<string>> => {
  try {
    await estimatesRepository.updateCheckedQty(estimateItemId, action);
    return {
      status: "success",
      data: "Successfully updated checkedQty"
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while updating checkedQty"
      }
    };
  }
};

const batchCheckItemsService = async (id: string, action: BatchCheckAction) => {
  try {
    const result = await estimatesRepository.batchCheckItems(id, action);
    if (result.changes > 0) {
      return {
        status: "success",
        data: {
          isAllChecked: action === BATCH_CHECK_ACTION.MARK_ALL
        },
        message:
          action === BATCH_CHECK_ACTION.MARK_ALL
            ? "All items have been marked as checked."
            : "All items have been unchecked."
      };
    }
    throw new Error("No Estimate Items were updated");
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong"
      }
    };
  }
};

const deleteEstimateById = async (id: string): Promise<ApiResponse<string>> => {
  try {
    const result = await estimatesRepository.deleteEstimateById(id);

    if (result.changes === 0) {
      return {
        status: "error",
        error: {
          message: `Could not delete Estimate with id: ${id}`
        }
      };
    }

    return {
      status: "success",
      data: `Successfully deleted Estimate with id:${id}`
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong"
      }
    };
  }
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
