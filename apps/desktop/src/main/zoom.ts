import type { WebContents } from "electron";
import type Store from "electron-store";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;

export type ZoomStore = Store<{ zoomFactor: number }>;

function clamp(factor: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, factor));
}

function readStored(store: ZoomStore): number {
  const v = store.get("zoomFactor");
  return typeof v === "number" && Number.isFinite(v) ? clamp(v) : 1;
}

// explicit zoom change from user action (menu / keyboard), also persist
export function setZoom(web: WebContents, store: ZoomStore, factor: number): void {
  const clamped = clamp(factor);
  web.setZoomFactor(clamped);
  store.set("zoomFactor", clamped);
}

// re-apply persisted zoom
export function restoreZoom(web: WebContents, store: ZoomStore): void {
  web.setZoomFactor(readStored(store));
}

// lock zoom and disable pinch to zoom, event to reset to persisted zoom value
export function registerZoomController(web: WebContents, store: ZoomStore): void {
  web.setVisualZoomLevelLimits(1, 1);

  web.on("zoom-changed", () => {
    const target = readStored(store);
    if (web.getZoomFactor() !== target) {
      web.setZoomFactor(target);
    }
  });
}
