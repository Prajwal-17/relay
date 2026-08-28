export const ZOOM_FACTOR_BOUNDS = {
  min: 0.85,
  max: 1.25,
  default: 1
} as const;

export const KEYBOARD_ZOOM_STEP_PERCENT = 5;

export type ZoomShortcutAction = "increase" | "decrease" | "reset";

type ZoomBounds = {
  min: number;
  max: number;
  default: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getZoomFactorForShortcut(
  currentFactor: number,
  action: ZoomShortcutAction,
  bounds: ZoomBounds = ZOOM_FACTOR_BOUNDS
): number {
  const minPercent = Math.round(bounds.min * 100);
  const maxPercent = Math.round(bounds.max * 100);
  const defaultPercent = clamp(Math.round(bounds.default * 100), minPercent, maxPercent);

  if (action === "reset") {
    return defaultPercent / 100;
  }

  const safeCurrentFactor = Number.isFinite(currentFactor) ? currentFactor : bounds.default;
  const currentPercent = clamp(Math.round(safeCurrentFactor * 100), minPercent, maxPercent);
  const nextPercent =
    action === "increase"
      ? (Math.floor(currentPercent / KEYBOARD_ZOOM_STEP_PERCENT) + 1) * KEYBOARD_ZOOM_STEP_PERCENT
      : (Math.ceil(currentPercent / KEYBOARD_ZOOM_STEP_PERCENT) - 1) * KEYBOARD_ZOOM_STEP_PERCENT;

  return clamp(nextPercent, minPercent, maxPercent) / 100;
}
