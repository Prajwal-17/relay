import { BrowserWindow, dialog, shell } from "electron";
import { ipcMain } from "electron/main";
import fs from "fs";
import os from "os";
import path, { join } from "path";
import { type ApiResponse, TRANSACTION_TYPE, type TransactionType } from "../../../shared/types";
import { formatDateStr } from "../../../shared/utils/dateUtils";
import { initMainEnv } from "../../loadEnv";
import { estimatesService } from "../../modules/estimates/estimates.service";
import { preferencesService } from "../../modules/preferences/preferences.service";
import { salesService } from "../../modules/sales/sales.service";

export function exportAsPdf() {
  ipcMain.on("show-item-in-folder", (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle(
    "txn:exportAsPdf",
    async (_event, id: string, type: TransactionType): Promise<ApiResponse<string>> => {
      let exportWindow: BrowserWindow | null = null;
      try {
        const mode = initMainEnv();
        const isDevBuild = mode === "development";
        const apiPort = isDevBuild ? 4723 : 4722;

        const preferences = await preferencesService.getPreferences("default");
        const askBeforeSavingPdf = preferences?.config?.exports?.askBeforeSavingPdf;

        let txnNo = "000";
        let dateStr = "date";

        if (type === TRANSACTION_TYPE.SALE) {
          const sale = await salesService.getSaleById(id);
          txnNo = String(sale.transactionNo);
          dateStr = formatDateStr(sale.createdAt || new Date().toISOString());
        } else if (type === TRANSACTION_TYPE.ESTIMATE) {
          const estimate = await estimatesService.getEstimateById(id);
          txnNo = String(estimate.transactionNo);
          dateStr = formatDateStr(estimate.createdAt || new Date().toISOString());
        }

        const filename = `${type}-${txnNo}-${dateStr}.pdf`.replaceAll(" ", "-");
        let pdfPath = "";

        if (askBeforeSavingPdf) {
          const { canceled, filePath } = await dialog.showSaveDialog({
            title: "Save PDF",
            defaultPath: filename,
            filters: [{ name: "PDF Documents", extensions: ["pdf"] }]
          });

          if (canceled || !filePath) {
            return { status: "error", error: { message: "Export canceled by user" } };
          }
          pdfPath = filePath;
        } else {
          let outputDir = preferences?.config?.exports?.defaultPdfLocation;
          if (!outputDir) {
            outputDir = path.join(os.homedir(), "Downloads", "Receipts");
          }

          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          pdfPath = path.join(outputDir, filename);
        }

        exportWindow = new BrowserWindow({
          show: false,
          autoHideMenuBar: false,
          webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            additionalArguments: [`--api-port=${apiPort}`]
          } as Electron.WebPreferences
        });

        if (isDevBuild && process.env["ELECTRON_RENDERER_URL"]) {
          const url = `${process.env["ELECTRON_RENDERER_URL"]}/#/export/pdf/${type}s?id=${id}`;
          await exportWindow.loadURL(url);
        } else {
          const indexPath = join(__dirname, "../renderer/index.html");
          await exportWindow.loadFile(indexPath, {
            hash: `/export/pdf/${type}?id=${id}`
          });
        }

        await exportWindow.webContents.executeJavaScript(`
          new Promise((resolve, reject) => {
            // if rendered, resolve
            if (document.getElementById('pdf-ready-marker')) {
              return resolve();
            }

            // watch the DOM for changes
            const observer = new MutationObserver((mutations, obs) => {
              if (document.getElementById('pdf-ready-marker')) {
                obs.disconnect(); // stop watching
                resolve();
              }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
              obs.disconnect();
              reject(new Error('Timeout waiting for pdf-ready-marker'));
            }, 15000);
          })
        `);

        // slight delay for css/fonts to fully paint after DOM is ready
        await new Promise((r) => setTimeout(r, 500));

        const pdfBuffer = await exportWindow.webContents.printToPDF({
          pageSize: "A4",
          printBackground: true,
          margins: { marginType: "none" }
        });

        await fs.promises.writeFile(pdfPath, pdfBuffer);

        if (exportWindow && !exportWindow.isDestroyed()) {
          exportWindow.close();
        }

        // open path
        return { status: "success", data: pdfPath };
      } catch (error) {
        console.error("Error generating PDF:", error);
        if (exportWindow && !exportWindow.isDestroyed()) {
          exportWindow.close();
        }
        return {
          status: "error",
          error: { message: (error as Error).message ?? "Failed to generate pdf" }
        };
      }
    }
  );
}
