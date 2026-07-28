import { app, BrowserWindow, ipcMain, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import type { DatabaseUpgradeStatus } from "../../shared/types";

const CHANNELS = {
  getStatus: "database-upgrade:get-status",
  status: "database-upgrade:status",
  retry: "database-upgrade:retry",
  openBackupFolder: "database-upgrade:open-backup-folder",
  quit: "database-upgrade:quit"
} as const;

let activeController: UpgradeWindowController | undefined;
let handlersRegistered = false;

function registerHandlers(): void {
  if (handlersRegistered) return;
  handlersRegistered = true;

  ipcMain.handle(CHANNELS.getStatus, () => activeController?.getStatus());
  ipcMain.handle(CHANNELS.retry, () => activeController?.retry());
  ipcMain.handle(CHANNELS.openBackupFolder, () => activeController?.openBackupFolder());
  ipcMain.on(CHANNELS.quit, () => activeController?.quit());
}

export type UpgradeWindowOptions = {
  isFreshDatabase: boolean;
  initialStatus: DatabaseUpgradeStatus;
  backupDirectory: string;
  preloadPath: string;
  rendererUrl?: string;
  onRetry: () => Promise<void>;
};

export class UpgradeWindowController {
  private window: BrowserWindow | undefined;
  private status: DatabaseUpgradeStatus;
  private allowClose = false;
  private retryPromise: Promise<void> | undefined;

  constructor(private readonly options: UpgradeWindowOptions) {
    this.status = options.initialStatus;
    activeController = this;
    registerHandlers();
  }

  async create(): Promise<void> {
    if (this.window && !this.window.isDestroyed()) return;

    this.window = new BrowserWindow({
      width: 640,
      height: 480,
      minWidth: 560,
      minHeight: 440,
      useContentSize: true,
      show: false,
      resizable: true,
      center: true,
      maximizable: false,
      minimizable: true,
      autoHideMenuBar: true,
      backgroundColor: "#f4f3ef",
      title: "QuickCart database upgrade",
      webPreferences: {
        preload: this.options.preloadPath,
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.window.on("close", (event) => {
      if (this.allowClose) return;
      if (this.status.state === "failed") {
        this.allowClose = true;
        app.quit();
        return;
      }
      event.preventDefault();
    });
    this.window.once("ready-to-show", () => this.window?.show());

    const kind = this.options.isFreshDatabase ? "fresh" : "existing";
    if (this.options.rendererUrl) {
      const baseUrl = this.options.rendererUrl.replace(/\/$/, "");
      await this.window.loadURL(`${baseUrl}/upgrade.html?kind=${kind}`);
    } else {
      await this.window.loadFile(path.join(__dirname, "../renderer/upgrade.html"), {
        query: { kind }
      });
    }
  }

  getStatus(): DatabaseUpgradeStatus {
    return { ...this.status };
  }

  update(status: DatabaseUpgradeStatus): void {
    this.status = { ...status };
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(CHANNELS.status, this.getStatus());
    }
  }

  focus(): void {
    if (!this.window || this.window.isDestroyed()) return;
    if (this.window.isMinimized()) this.window.restore();
    this.window.focus();
  }

  async retry(): Promise<void> {
    if (this.retryPromise) return this.retryPromise;
    this.retryPromise = this.options.onRetry().finally(() => {
      this.retryPromise = undefined;
    });
    return this.retryPromise;
  }

  async openBackupFolder(): Promise<void> {
    if (!this.status.backupAvailable || !fs.existsSync(this.options.backupDirectory)) {
      throw new Error("No database backup is available for this upgrade.");
    }
    const error = await shell.openPath(this.options.backupDirectory);
    if (error) throw new Error(error);
  }

  quit(): void {
    this.allowClose = true;
    app.quit();
  }

  close(): void {
    this.allowClose = true;
    if (this.window && !this.window.isDestroyed()) this.window.close();
    if (activeController === this) activeController = undefined;
  }
}
