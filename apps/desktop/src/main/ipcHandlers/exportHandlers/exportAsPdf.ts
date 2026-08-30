import { app, BrowserWindow, dialog, shell } from "electron";
import { ipcMain } from "electron/main";
import fs from "fs";
import os from "os";
import path, { join } from "path";
import { type ApiResponse, TRANSACTION_TYPE, type TransactionType } from "../../../shared/types";
import { resolveApiPort } from "../../../shared/runtimeConfig";
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
        const apiPort = resolveApiPort(process.env.M_VITE_API_PORT, mode);
        const apiToken = process.env.M_VITE_API_TOKEN ?? "";

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

          await fs.promises.mkdir(outputDir, { recursive: true });
          pdfPath = path.join(outputDir, filename);
        }

        exportWindow = new BrowserWindow({
          show: false,
          autoHideMenuBar: false,
          webPreferences: {
            preload: join(app.getAppPath(), "out/preload/index.js"),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false,
            additionalArguments: [`--api-port=${apiPort}`, `--api-token=${apiToken}`]
          } as Electron.WebPreferences
        });

        const exportRoute = `/export/pdf/${type}s?id=${id}`;

        if (isDevBuild && process.env["ELECTRON_RENDERER_URL"]) {
          const url = `${process.env["ELECTRON_RENDERER_URL"]}/#${exportRoute}`;
          await exportWindow.loadURL(url);
        } else {
          const indexPath = join(app.getAppPath(), "out/renderer/index.html");
          await exportWindow.loadFile(indexPath, {
            hash: exportRoute
          });
        }

        await exportWindow.webContents.executeJavaScript(`
          new Promise((resolve, reject) => {
            let settled = false;
            const finish = (callback, value) => {
              if (settled) return;
              settled = true;
              observer.disconnect();
              clearTimeout(timeout);
              callback(value);
            };
            const inspect = () => {
              const errorMarker = document.querySelector('[data-pdf-export-error]');
              if (errorMarker) {
                const message =
                  errorMarker.getAttribute('data-pdf-export-error') ||
                  errorMarker.textContent?.replace(/\\s+/g, ' ').trim();
                finish(reject, new Error(message || 'The PDF page could not be prepared.'));
                return;
              }
              if (!document.getElementById('pdf-ready-marker')) return;

              Promise.resolve(document.fonts?.ready)
                .then(() => new Promise((painted) => requestAnimationFrame(() => painted())))
                .then(() => finish(resolve, true))
                .catch((error) => finish(reject, error));
            };
            const observer = new MutationObserver(inspect);
            observer.observe(document.body, { childList: true, subtree: true });
            const timeout = setTimeout(
              () => finish(reject, new Error('Timed out while preparing the PDF.')),
              8000
            );
            inspect();
          })
        `);

        const pdfBuffer = await exportWindow.webContents.printToPDF({
          pageSize: "A4",
          printBackground: true,
          margins: { marginType: "none" }
        });

        await fs.promises.writeFile(pdfPath, pdfBuffer);

        return { status: "success", data: pdfPath };
      } catch (error) {
        console.error("Error generating PDF:", error);
        return {
          status: "error",
          error: { message: (error as Error).message ?? "Failed to generate pdf" }
        };
      } finally {
        if (exportWindow && !exportWindow.isDestroyed()) {
          exportWindow.close();
        }
      }
    }
  );
}
