import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import fs from "fs";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import os from "os";
import path from "path";
import { TRANSACTION_TYPE, type ApiResponse, type TransactionType } from "../../../shared/types";
import { formatDateStrToISTDateStr } from "../../../shared/utils/dateUtils";
import { formatToRupees, IndianRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimates, sales } from "../../db/schema";

export function saveAsPDF() {
  ipcMain.handle(
    "shareApi:saveAsPDF",
    async (_event, id: string, type: TransactionType): Promise<ApiResponse<string>> => {
      try {
        const doc = new jsPDF();

        let transaction;
        if (type === TRANSACTION_TYPE.SALE) {
          transaction = await db.query.sales.findFirst({
            where: eq(sales.id, id),
            with: {
              saleItems: true
            }
          });
        } else if (type === TRANSACTION_TYPE.ESTIMATE) {
          transaction = await db.query.estimates.findFirst({
            where: eq(estimates.id, id),
            with: {
              estimateItems: true
            }
          });
        } else {
          throw new Error("Something went wrong");
        }

        const outputDir = path.join(os.homedir(), "Documents", "Receipts");

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir);
        }

        if (!transaction) {
          throw new Error("Transaction not found");
        }

        const billingNo =
          type === TRANSACTION_TYPE.SALE ? transaction?.invoiceNo : transaction?.estimateNo;
        const trimmedDate = transaction.createdAt;

        const createdAt = new Date(trimmedDate).toLocaleString("en-IN", {
          dateStyle: "medium"
        });

        const { fullDate, timePart } = formatDateStrToISTDateStr(transaction.createdAt);

        const filename = `${type}-${billingNo}-${createdAt}.pdf`.replaceAll(" ", "-");
        const pdfPath = path.join(outputDir, filename);

        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 15;

        // header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("SRI MANJUNATHESHWARA STORES", marginX, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("6th main Rukmini Nagar", marginX, 28);
        doc.text("Bangalore 560073", marginX, 33);
        doc.text("+91 9945029729", marginX, 38);

        const transactionType = type.charAt(0).toUpperCase() + type.slice(1);
        doc.setFont("helvetica", "bold");
        doc.text(transactionType, pageWidth - marginX, 20, {
          align: "right"
        });
        doc.setFont("helvetica", "normal");
        doc.text(
          `${type === "sale" ? "Invoice #:" : "Estimate #:"} ${billingNo}`,
          pageWidth - marginX,
          28,
          { align: "right" }
        );
        doc.text(`${fullDate} ${timePart}`, pageWidth - marginX, 33, {
          align: "right"
        });

        // horizontal separator
        doc.setLineWidth(0.1);
        doc.line(marginX, 45, pageWidth - marginX, 45);

        // table
        let tableData;
        if (type === TRANSACTION_TYPE.SALE) {
          tableData = await transaction.saleItems.map((item, idx) => {
            return [
              idx + 1,
              item.name,
              item.quantity,
              formatToRupees(item.price),
              formatToRupees(item.totalPrice)
            ];
          });
        } else if (type === TRANSACTION_TYPE.ESTIMATE) {
          tableData = await transaction.estimateItems.map((item, idx) => {
            return [
              idx + 1,
              item.name,
              item.quantity,
              formatToRupees(item.price),
              formatToRupees(item.totalPrice)
            ];
          });
        } else {
          throw new Error("Something went wrong while generating Pdf");
        }

        autoTable(doc, {
          startY: 50,
          head: [["#", "Item Name", "Qty", "Unit Price", "Total"]],
          body: tableData,
          theme: "grid",
          headStyles: {
            fillColor: [22, 160, 133] //green
          },
          margin: { left: marginX, right: marginX }
        });

        // The 'finalY' property for positioning the footer
        const finalY = (doc as any).lastAutoTable.finalY;

        let calcTotalAmount;
        if (type === TRANSACTION_TYPE.SALE) {
          calcTotalAmount = transaction.saleItems.reduce((sum, currentItem) => {
            return sum + Number(formatToRupees(currentItem.totalPrice) || 0);
          }, 0);
        } else if (type === TRANSACTION_TYPE.ESTIMATE) {
          calcTotalAmount = transaction.estimateItems.reduce((sum, currentItem) => {
            return sum + Number(formatToRupees(currentItem.totalPrice) || 0);
          }, 0);
        } else {
          throw new Error("Something went wrong while generating Pdf");
        }

        const subtotal = IndianRupees.format(calcTotalAmount);
        const total = IndianRupees.format(Math.round(calcTotalAmount));

        doc.setFontSize(12);
        doc.text("Subtotal:", pageWidth - marginX - 30, finalY + 15, { align: "right" });
        doc.text(`Rs. ${subtotal.slice(1)}`, pageWidth - marginX, finalY + 15, { align: "right" });

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Total:", pageWidth - marginX - 30, finalY + 24, { align: "right" });
        doc.text(`Rs. ${total.slice(1)}`, pageWidth - marginX, finalY + 24, { align: "right" });

        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("Thank you!", marginX, finalY + 40, { align: "left" });

        doc.save(pdfPath);

        return { status: "success", data: "Succesfully generated Pdf" };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: { message: (error as Error).message ?? "Failed generate pdf" }
        };
      }
    }
  );
}
