import { asc, desc, type SQL } from "drizzle-orm";
import {
  SortOption,
  TRANSACTION_TYPE,
  type ApiResponse,
  type CustomerTransaction,
  type PaginatedApiResponse,
  type TransactionListResponse,
  type UnifiedTransactionItem,
  type UnifiedTransctionWithItems
} from "../../../shared/types";
import { sales } from "../../db/schema";
import { salesRepository } from "./sales.repository";
import type { FilterSalesParams, SalesByCustomerParams } from "./sales.types";

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

    const items: UnifiedTransactionItem[] = sale.saleItems.map((item) => ({
      ...item,
      parentId: item.saleId,
      checkedQty: item.checkedQty ?? 0
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

const getSalesByCustomerId = async (
  params: SalesByCustomerParams
): Promise<PaginatedApiResponse<CustomerTransaction[] | []>> => {
  try {
    const sales = await salesRepository.getSalesByCustomerId(params);

    const nextPageNo = sales.length === 20 ? params.pageNo + 1 : null;

    return {
      status: "success",
      nextPageNo: nextPageNo,
      data:
        sales.length > 0
          ? sales.map((s) => ({
              type: TRANSACTION_TYPE.SALE,
              transactionNo: s.invoiceNo,
              ...s
            }))
          : []
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
  getSalesByCustomerId,
  filterSalesByDate,
  convertSaleToEstimate,
  deleteSaleById
};
