import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import fs from "fs";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import os from "os";
import path from "path";
import { TRANSACTION_TYPE, type ApiResponse, type TransactionType } from "../../../shared/types";
import { formatDateStrToISTDateStr } from "../../../shared/utils/dateUtils";
import { convertToRupees, fromMilliUnits } from "../../../shared/utils/utils";
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

        if (type === TRANSACTION_TYPE.SALE) {
          doc.text("GSTIN : 29BHBPR8333N2ZM", marginX, 43);
        }

        // horizontal separator
        const separatorY = type === TRANSACTION_TYPE.SALE ? 50 : 45;
        doc.setLineWidth(0.1);
        doc.line(marginX, separatorY, pageWidth - marginX, separatorY);

        // table
        let tableData;
        if (type === TRANSACTION_TYPE.SALE) {
          tableData = await transaction.saleItems.map((item, idx) => {
            return [
              idx + 1,
              item.productSnapshot,
              fromMilliUnits(item.quantity),
              convertToRupees(item.price),
              convertToRupees(item.totalPrice)
            ];
          });
        } else if (type === TRANSACTION_TYPE.ESTIMATE) {
          tableData = await transaction.estimateItems.map((item, idx) => {
            return [
              idx + 1,
              item.productSnapshot,
              fromMilliUnits(item.quantity),
              convertToRupees(item.price),
              convertToRupees(item.totalPrice)
            ];
          });
        } else {
          throw new Error("Something went wrong while generating Pdf");
        }

        autoTable(doc, {
          startY: separatorY + 5,
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

        let total;
        if (type === TRANSACTION_TYPE.SALE) {
          total = transaction.saleItems.reduce((sum, currentItem) => {
            return sum + Number(currentItem.totalPrice || 0);
          }, 0);
        } else if (type === TRANSACTION_TYPE.ESTIMATE) {
          total = transaction.estimateItems.reduce((sum, currentItem) => {
            return sum + Number(currentItem.totalPrice || 0);
          }, 0);
        } else {
          throw new Error("Something went wrong while generating Pdf");
        }

        const subtotal = convertToRupees(total).toFixed(2);
        const grandTotal = Math.round(convertToRupees(total)).toFixed(2);

        const valueX = pageWidth - marginX;
        const labelX = valueX - 60;

        doc.setFontSize(12);
        doc.text("Subtotal:", labelX, finalY + 15, { align: "right" });
        doc.text(`Rs. ${subtotal}`, valueX, finalY + 15, { align: "right" });

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Total:", labelX, finalY + 24, { align: "right" });
        doc.text(`Rs. ${grandTotal}`, valueX, finalY + 24, { align: "right" });

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
