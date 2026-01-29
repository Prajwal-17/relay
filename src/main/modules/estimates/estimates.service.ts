import { TRANSACTION_TYPE, type Estimate, type PaginatedApiResponse } from "../../../shared/types";
import { estimatesRepository } from "./estimates.repository";
import type { EstimatesByCustomerParams } from "./estimates.types";

const getEstimatesByCustomerId = async (
  params: EstimatesByCustomerParams
): Promise<PaginatedApiResponse<Estimate[] | []>> => {
  try {
    const estimates = await estimatesRepository.getEstimatesByCustomerId(params);

    const nextPageNo = estimates.length === 20 ? params.pageNo + 1 : null;

    return {
      status: "success",
      nextPageNo: nextPageNo,
      data:
        estimates.length > 0
          ? estimates.map((e) => ({
              type: TRANSACTION_TYPE.SALE,
              transactionNo: e.estimateNo,
              ...e
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

export const estimatesService = {
  getEstimatesByCustomerId
};
