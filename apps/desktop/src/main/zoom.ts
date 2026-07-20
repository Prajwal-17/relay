import type { WebContents } from "electron";
import type Store from "electron-store";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 1.5;

export type ZoomStore = Store<{ zoomFactor: number }>;

let cachedZoom: number = 1;

function clamp(factor: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, factor));
}

// explicit zoom change from user action (menu / keyboard), also persist
export function setZoom(web: WebContents, store: ZoomStore, factor: number): void {
  const clamped = clamp(factor);
  cachedZoom = clamped;
  store.set("zoomFactor", clamped);
  web.setZoomFactor(clamped);
}

// re-apply persisted zoom
export function restoreZoom(web: WebContents, store: ZoomStore): void {
  const stored = store.get("zoomFactor");
  const zoom = typeof stored === "number" && Number.isFinite(stored) ? clamp(stored) : 1;
  cachedZoom = zoom;
  web.setZoomFactor(zoom);
}

// lock zoom and disable pinch to zoom, event to reset to persisted zoom value
export function registerZoomController(web: WebContents): void {
  web.setVisualZoomLevelLimits(1, 1);

  web.on("zoom-changed", () => {
    if (web.getZoomFactor() !== cachedZoom) {
      web.setZoomFactor(cachedZoom);
    }
  });
}

export function getZoom(): number {
  return cachedZoom;
}
