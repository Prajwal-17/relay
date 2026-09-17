// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import type { AppWindowApi, ZoomApi } from "@shared/types";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppTitleBar } from "./AppTitleBar";

const appWindowApi = {
  getMetadata: vi.fn(() => Promise.resolve({ name: "Relay-Dev", version: "4.4.8" })),
  isMaximized: vi.fn(() => Promise.resolve(false)),
  toggleMaximize: vi.fn(() => Promise.resolve(true)),
  minimize: vi.fn(),
  close: vi.fn(),
  reload: vi.fn(),
  checkForUpdates: vi.fn(),
  onMaximizedChange: vi.fn(() => vi.fn())
} satisfies AppWindowApi;

const zoomApi = {
  getZoom: vi.fn(() => Promise.resolve({ zoomFactor: 1 })),
  setZoom: vi.fn((zoomFactor: number) => Promise.resolve({ zoomFactor })),
  getBounds: vi.fn(() => Promise.resolve({ min: 0.85, max: 1.25, default: 1 }))
} satisfies ZoomApi;

beforeEach(() => {
  vi.clearAllMocks();
  window.appWindowApi = appWindowApi;
  window.zoomApi = zoomApi;
});

afterEach(() => {
  cleanup();
  delete window.appWindowApi;
});

describe("AppTitleBar", () => {
  it("shows application identity and operates the native window controls", async () => {
    render(<AppTitleBar />);

    expect(await screen.findByText("Relay-Dev")).toBeVisible();
    expect(screen.getByText("v4.4.8")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Minimize window" }));
    fireEvent.click(screen.getByRole("button", { name: "Maximize window" }));
    fireEvent.click(screen.getByRole("button", { name: "Close window" }));

    expect(appWindowApi.minimize).toHaveBeenCalledOnce();
    expect(appWindowApi.toggleMaximize).toHaveBeenCalledOnce();
    expect(appWindowApi.close).toHaveBeenCalledOnce();
    expect(await screen.findByRole("button", { name: "Restore window" })).toBeVisible();
  });

  it("preserves reload and zoom keyboard shortcuts without a native menu", async () => {
    render(<AppTitleBar />);

    fireEvent.keyDown(window, { key: "r", ctrlKey: true });
    fireEvent.keyDown(window, { key: "=", ctrlKey: true });

    expect(appWindowApi.reload).toHaveBeenCalledOnce();
    await waitFor(() => expect(zoomApi.setZoom).toHaveBeenCalledWith(1.05));
  });
});
