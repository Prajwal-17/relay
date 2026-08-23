/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
// NODE_OPTIONS also reaches QuickCart's forked Node server; patch only Electron's main process.
if (process.versions.electron) {
  const { BrowserWindow } = require("electron");

  // The renderer remains a real BrowserWindow. Suppressing native visibility calls preserves
  // migrations, layout, screenshots, and Playwright input without flashing on the desktop.
  BrowserWindow.prototype.show = function suppressShow() {};
  BrowserWindow.prototype.focus = function suppressFocus() {};
  BrowserWindow.prototype.moveTop = function suppressMoveTop() {};
}
