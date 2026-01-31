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
  type UpdateQtyAction,
  type UpdateSaleResponse
} from "../../../shared/types";
import { sales } from "../../db/schema";
import { salesRepository } from "./sales.repository";
import type { FilterSalesParams, UpdateSaleParams } from "./sales.types";

const getSaleById = async (id: string): Promise<ApiResponse<UnifiedTransctionWithItems>> => {
  try {
    const sale = await salesRepository.getSaleById(id);

    if (!sale) {
      return {
        status: "error",
        error: {
          message: `Sale with id ${id} does not exist.`
        }
      };
    }

    // eslint-disable-next-line
    const items: UnifiedTransactionItem[] = sale.saleItems.map(({ saleId, ...rest }) => ({
      ...rest,
      checkedQty: rest.checkedQty ?? 0
    }));

    return {
      status: "success",
      data: {
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
      }
    };
  } catch (error) {
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while fetching Sale"
      }
    };
  }
};

const getNextInvoiceNo = async (): Promise<ApiResponse<number>> => {
  try {
    const latestInvoice = await salesRepository.getLatestInvoiceNo();
    let nextInvoiceNo = 1;

    if (latestInvoice) {
      nextInvoiceNo = latestInvoice.invoiceNo + 1;
    }

    return {
      status: "success",
      data: nextInvoiceNo
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

const filterSalesByDate = async (
  params: FilterSalesParams
): Promise<PaginatedApiResponse<TransactionListResponse>> => {
  try {
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

const createSale = async (payload: TxnPayloadData): Promise<ApiResponse<{ id: string }>> => {
  try {
    const finalItems = payload.items.map((item) => {
      const total = Math.round((item.price * item.quantity) / 1000);
      return {
        ...item,
        totalPrice: total
      };
    });

    const total = finalItems.reduce((sum, currentItem) => {
      return sum + Number(currentItem.totalPrice || 0);
    }, 0);

    const totalQuantity = finalItems.reduce((sum, currentItem) => {
      return sum + currentItem.quantity;
    }, 0);

    const finalPayload = {
      ...payload,
      items: finalItems,
      grandTotal: total,
      totalQuantity: totalQuantity
    };

    const newSale = await salesRepository.createSale(finalPayload);

    return {
      status: "success",
      data: {
        id: newSale
      }
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while creating sale"
      }
    };
  }
};

const updateSale = async (
  id: string,
  payload: TxnPayloadData
): Promise<ApiResponse<UpdateSaleResponse>> => {
  try {
    const finalItems = payload.items.map((item) => {
      const total = Math.round((item.price * item.quantity) / 1000);
      return {
        ...item,
        totalPrice: total
      };
    });

    const total = finalItems.reduce((sum, currentItem) => {
      return sum + Number(currentItem.totalPrice || 0);
    }, 0);

    const totalQuantity = finalItems.reduce((sum, currentItem) => {
      return sum + currentItem.quantity;
    }, 0);

    const finalPayload: UpdateSaleParams = {
      ...payload,
      items: finalItems,
      grandTotal: total,
      totalQuantity: totalQuantity
    };

    const result = await salesRepository.updateSale(id, finalPayload);

    return {
      status: "success",
      data: {
        id,
        type: TRANSACTION_TYPE.SALE,
        ...result
      }
    };
  } catch (error) {
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while updating sale"
      }
    };
  }
};

const convertSaleToEstimate = async (id: string): Promise<ApiResponse<string>> => {
  try {
    const result = await salesRepository.convertSaleToEstimate(id);

    if (result.changes === 0) {
      return {
        status: "error",
        error: {
          message: `Could not convert Sale To Estimate having id: ${id}`
        }
      };
    }

    return {
      status: "success",
      data: `Successfully converted Sale To Estimate having id:${id}`
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
  saleItemId: string,
  action: UpdateQtyAction
): Promise<ApiResponse<string>> => {
  try {
    await salesRepository.updateCheckedQty(saleItemId, action);
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
    const result = await salesRepository.batchCheckItems(id, action);
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
    throw new Error("No Sale Items were updated");
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

const deleteSaleById = async (id: string): Promise<ApiResponse<string>> => {
  try {
    const result = await salesRepository.deleteSaleById(id);

    if (result.changes === 0) {
      return {
        status: "error",
        error: {
          message: `Could not delete Sale with id: ${id}`
        }
      };
    }

    return {
      status: "success",
      data: `Successfully deleted Sale with id:${id}`
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
