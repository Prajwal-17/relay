import { desc, eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import {
  TRANSACTION_TYPE,
  type Estimate,
  type PaginatedApiResponse,
  type Sale
} from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimates, sales } from "../../db/schema";

export function getAllTransactionsById() {
  // get transaction wrt to customer id
  ipcMain.handle(
    "customersApi:getAllTransactionsById",
    async (
      _event,
      customerId,
      type,
      pageNo
    ): Promise<PaginatedApiResponse<Sale[] | Estimate[] | []>> => {
      try {
        if (pageNo === null || pageNo === undefined) {
          return {
            status: "success",
            nextPageNo: null,
            data: []
          };
        }
        if (type === TRANSACTION_TYPE.SALE) {
          const offset = (pageNo - 1) * 20;
          const result = await db.query.sales.findMany({
            where: eq(sales.customerId, customerId),
            orderBy: desc(sales.createdAt),
            limit: 20,
            offset: offset
          });

          const nextPageNo = result.length === 20 ? pageNo + 1 : null;

          return {
            status: "success",
            nextPageNo: nextPageNo,
            data:
              result.length > 0
                ? result.map((s) => ({
                    ...s,
                    invoiceNo: s.invoiceNo,
                    grandTotal: s.grandTotal && formatToRupees(s.grandTotal)
                  }))
                : []
          };
        }

        if (type === TRANSACTION_TYPE.ESTIMATE) {
          const offset = (pageNo - 1) * 20;
          const result = await db.query.estimates.findMany({
            where: eq(estimates.customerId, customerId),
            orderBy: desc(estimates.createdAt),
            limit: 20,
            offset: offset
          });

          const nextPageNo = result.length === 20 ? pageNo + 1 : null;

          return {
            status: "success",
            nextPageNo: nextPageNo,
            data:
              result.length > 0
                ? result.map((e) => ({
                    ...e,
                    estimateNo: e.estimateNo,
                    grandTotal: e.grandTotal && formatToRupees(e.grandTotal)
                  }))
                : []
          };
        }

        return {
          status: "success",
          nextPageNo: null,
          data: []
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: { message: "Something went wrong" }
        };
      }
    }
  );
}
