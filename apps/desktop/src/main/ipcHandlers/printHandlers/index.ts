import { ipcMain } from "electron/main";
import { listPrinters, printLedger, printReceipt, printReceiptWithLedger } from "./printOperations";

export function printHandlers() {
  ipcMain.handle("printer:list", (event) => listPrinters(event.sender));
  ipcMain.handle("printer:raw-receipt", (_event, receipt: unknown, raster: unknown) =>
    printReceipt(receipt, raster)
  );
  ipcMain.handle("printer:raw-ledger", (_event, statement: unknown, raster: unknown) =>
    printLedger(statement, raster)
  );
  ipcMain.handle(
    "printer:raw-receipt-with-ledger",
    (_event, receipt: unknown, statement: unknown, receiptRaster: unknown, ledgerRaster: unknown) =>
      printReceiptWithLedger(receipt, statement, receiptRaster, ledgerRaster)
  );
}
