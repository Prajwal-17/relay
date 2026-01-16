import { asc, desc, type SQL } from "drizzle-orm";
import {
  SortOption,
  TRANSACTION_TYPE,
  type ApiResponse,
  type Customer,
  type PaginatedApiResponse,
  type TransactionListResponse,
  type TxnPayloadData,
  type UnifiedTransactionItem,
  type UnifiedTransctionWithItems,
  type UpdateSaleResponse
} from "../../../shared/types";
import { CustomerRole } from "../../db/enum";
import { sales } from "../../db/schema";
import { customersRepository } from "../customers/customers.repository";
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
    // customer validation
    let customer: Customer | undefined;
    if (!payload.customerName || payload.customerName.trim() === "") {
      const [defaultCustomer] = await customersRepository.getCustomers("DEFAULT");
      customer = defaultCustomer;
    } else if (payload.customerId && payload.customerName) {
      const existingCustomer = await customersRepository.findById(payload.customerId);
      customer = existingCustomer;
    } else if (!payload.customerId && payload.customerName) {
      const [existingCustomer] = await customersRepository.getCustomers(payload.customerName);

      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        const newCustomer = await customersRepository.createCustomer({
          name: payload.customerName,
          contact: payload.customerContact ?? null,
          customerType: CustomerRole.CASH
        });
        customer = newCustomer;
      }
    }

    if (!customer) {
      throw new Error("Something went wrong.Could not find customer.");
    }
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

    const newSale = await salesRepository.createSale(customer.id, finalPayload);

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
    // TODO - customer validation

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
  deleteSaleById
};
