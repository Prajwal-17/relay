import { desc } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { sales } from "../../db/schema";

export function getNextInvoiceNo() {
  // get next invoice no
  ipcMain.handle("salesApi:getNextInvoiceNo", async (): Promise<ApiResponse<number>> => {
    try {
      const lastInvoice = await db.select().from(sales).orderBy(desc(sales.invoiceNo)).limit(1);
      const lastInvoiceNo = lastInvoice[0]?.invoiceNo;
      let nextInvoiceNo = 1;

      if (lastInvoiceNo) {
        nextInvoiceNo = lastInvoiceNo + 1;
      }

      return { status: "success", data: nextInvoiceNo };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Failed to retrieve next invoice number" } };
    }
  });
}
