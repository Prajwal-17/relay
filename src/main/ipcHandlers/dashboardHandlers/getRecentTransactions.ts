import { desc } from "drizzle-orm";
import { ipcMain } from "electron";
import {
  TRANSACTION_TYPE,
  type ApiResponse,
  type Estimate,
  type Sale
} from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimates, sales } from "../../db/schema";

export function getRecentTransactions() {
  ipcMain.handle(
    "dashboardApi:getRecentTransactions",
    async (
      _event,
      type
    ): Promise<
      ApiResponse<
        (Sale & { customerName: string })[] | (Estimate & { customerName: string })[] | []
      >
    > => {
      try {
        if (type === TRANSACTION_TYPE.SALE) {
          const result = await db.query.sales.findMany({
            with: {
              customer: true
            },
            orderBy: desc(sales.createdAt),
            limit: 5
          });

          return {
            status: "success",
            data:
              result.length > 0
                ? result.map((r) => ({
                    ...r,
                    transactionNo: r.invoiceNo,
                    customerName: r.customer.name,
                    grandTotal: r.grandTotal && formatToRupees(r.grandTotal)
                  }))
                : []
          };
        } else if (type === TRANSACTION_TYPE.ESTIMATE) {
          const result = await db.query.estimates.findMany({
            with: {
              customer: true
            },
            orderBy: desc(estimates.createdAt),
            limit: 5
          });

          return {
            status: "success",
            data:
              result.length > 0
                ? result.map((r) => ({
                    ...r,
                    transactionNo: r.estimateNo,
                    customerName: r.customer.name,
                    grandTotal: r.grandTotal && formatToRupees(r.grandTotal)
                  }))
                : []
          };
        }
        return {
          status: "success",
          data: []
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message: (error as Error).message ?? "Could not fetch Recent Transactions."
          }
        };
      }
    }
  );
}
