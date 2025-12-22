import {
  TRANSACTION_TYPE,
  type CustomerTransaction,
  type PaginatedApiResponse
} from "../../../shared/types";
import { salesRepository } from "./sales.repository";
import type { SalesByCustomerParams } from "./sales.types";

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

export const salesService = {
  getSalesByCustomerId
};
