import { eq } from "drizzle-orm";
import { clipboard, shell } from "electron/common";
import { ipcMain } from "electron/main";
import fs from "fs";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import os from "os";
import path from "path";
import { TRANSACTION_TYPE, type ApiResponse, type TransactionType } from "../../../shared/types";
import { formatDateStrToISTDateStr, removeTandZ } from "../../../shared/utils/dateUtils";
import { formatToRupees, IndianRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { estimates, sales } from "../../db/schema";

export function sendViaWhatsapp() {
  ipcMain.handle(
    "shareApi:sendViaWhatsapp",
    async (_event, id: string, type: TransactionType): Promise<ApiResponse<string>> => {
      try {
        const doc = new jsPDF();

        let transaction;
        if (type === TRANSACTION_TYPE.SALES) {
          transaction = await db.query.sales.findFirst({
            where: eq(sales.id, id),
            with: {
              saleItems: true
            }
          });
        } else if (type === TRANSACTION_TYPE.ESTIMATES) {
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
          type === TRANSACTION_TYPE.SALES ? transaction?.invoiceNo : transaction?.estimateNo;
        const trimmedDate = removeTandZ(transaction.createdAt);

        const createdAt = new Date(trimmedDate).toLocaleString("en-IN", {
          dateStyle: "medium"
        });

        const dateTime = formatDateStrToISTDateStr(transaction.createdAt);

        const filename = `${type}-${billingNo}-${createdAt}.pdf`.replaceAll(" ", "-");
        const pdfPath = path.join(outputDir, filename);
        console.log("pdfpath", pdfPath)

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

        const transactionType = type.charAt(0).toUpperCase() + type.slice(1, -1);
        doc.setFont("helvetica", "bold");
        doc.text(transactionType, pageWidth - marginX, 20, {
          align: "right"
        });
        doc.setFont("helvetica", "normal");
        doc.text(
          `${type === "sales" ? "Invoice #:" : "Estimate #:"} ${billingNo}`,
          pageWidth - marginX,
          28,
          { align: "right" }
        );
        doc.text(dateTime, pageWidth - marginX, 33, {
          align: "right"
        });

        // horizontal separator
        doc.setLineWidth(0.1);
        doc.line(marginX, 45, pageWidth - marginX, 45);

        // table
        let tableData;
        if (type === TRANSACTION_TYPE.SALES) {
          tableData = await transaction.saleItems.map((item, idx) => {
            return [
              idx + 1,
              item.name,
              item.quantity,
              formatToRupees(item.price),
              formatToRupees(item.totalPrice)
            ];
          });
        } else if (type === TRANSACTION_TYPE.ESTIMATES) {
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
        if (type === TRANSACTION_TYPE.SALES) {
          calcTotalAmount = transaction.saleItems.reduce((sum, currentItem) => {
            return sum + Number(formatToRupees(currentItem.totalPrice) || 0);
          }, 0);
        } else if (type === TRANSACTION_TYPE.ESTIMATES) {
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

        // copyFileToClipboard(pdfPath);
        // revealFileInFolder(pdfPath);

        // await shell.openExternal("https://web.whatsapp.com");
        // shell.openExternal("whatsapp://send");

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

function copyFileToClipboard(filePath: string) {
  if (process.platform === "linux") {
    const fileUri = `file://${filePath}`;

    // GNOME / Nautilus format
    clipboard.writeBuffer("x-special/gnome-copied-files", Buffer.from(`copy\n${fileUri}`, "utf8"));

    clipboard.write({
      text: fileUri,
      bookmark: fileUri
    });

    clipboard.writeBuffer("text/uri-list", Buffer.from(fileUri, "utf8"));
  } else if (process.platform === "win32") {
    console.log("here")
    const absoluteFilePath = path.resolve(filePath)
    // const fileList = filePath + "\0\0";
    // const buffer = Buffer.from(fileList, "utf16le");
    // clipboard.writeBuffer("FileNameW", buffer);
    // clipboard.writeText(filePath)
    // const fileList = absoluteFilePath + "\0\0";
    // const buffer = Buffer.from(fileList, "utf16le");

    // // 'FileNameW' is the format identifier for CF_HDROP in many clipboard libraries.
    // clipboard.writeBuffer("FileNameW", buffer);
    // const fileList = absoluteFilePath + '\0\0'; // Must be double-null-terminated
    // const buffer = Buffer.from(fileList, 'utf16le'); // Must be utf16le encoded

    // 'FileNameW' is the identifier for the file-copy format.
    // clipboard.writeBuffer('FileNameW', buffer);
    // clipboard.clear();
    // clipboard.writeBuffer('FileNameW', buffer);

    // As a fallback, also write the plain text path
    // clipboard.writeText(absoluteFilePath);

    // console.log(`File at "${absoluteFilePath}" is ready to be pasted.`);
    const fileUri = `file://${filePath}`;

    // GNOME / Nautilus format
    clipboard.writeBuffer("x-special/gnome-copied-files", Buffer.from(`copy\n${fileUri}`, "utf8"));

    clipboard.write({
      text: fileUri,
      bookmark: fileUri
    });

    clipboard.writeBuffer("text/uri-list", Buffer.from(fileUri, "utf8"));
  }

}
