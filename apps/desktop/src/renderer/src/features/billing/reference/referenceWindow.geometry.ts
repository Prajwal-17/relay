export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type WindowFrame = Point & Size;
export type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

export const MIN_WINDOW_WIDTH = 320;
export const MIN_WINDOW_HEIGHT = 320;
export const WINDOW_EDGE_GAP = 10;

export const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const clampWindowFrame = (frame: WindowFrame, screen: Size): WindowFrame => {
  const availableWidth = Math.max(1, screen.width - WINDOW_EDGE_GAP * 2);
  const availableHeight = Math.max(1, screen.height - WINDOW_EDGE_GAP * 2);
  const minimumWidth = Math.min(MIN_WINDOW_WIDTH, availableWidth);
  const minimumHeight = Math.min(MIN_WINDOW_HEIGHT, availableHeight);
  const width = clamp(frame.width, minimumWidth, availableWidth);
  const height = clamp(frame.height, minimumHeight, availableHeight);

  return {
    width,
    height,
    x: clamp(
      frame.x,
      WINDOW_EDGE_GAP,
      Math.max(WINDOW_EDGE_GAP, screen.width - width - WINDOW_EDGE_GAP)
    ),
    y: clamp(
      frame.y,
      WINDOW_EDGE_GAP,
      Math.max(WINDOW_EDGE_GAP, screen.height - height - WINDOW_EDGE_GAP)
    )
  };
};

export const resizeWindowFrame = (
  frame: WindowFrame,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
  screen: Size
): WindowFrame => {
  const availableWidth = Math.max(1, screen.width - WINDOW_EDGE_GAP * 2);
  const availableHeight = Math.max(1, screen.height - WINDOW_EDGE_GAP * 2);
  const minimumWidth = Math.min(MIN_WINDOW_WIDTH, availableWidth);
  const minimumHeight = Math.min(MIN_WINDOW_HEIGHT, availableHeight);
  const screenRight = screen.width - WINDOW_EDGE_GAP;
  const screenBottom = screen.height - WINDOW_EDGE_GAP;

  let left = frame.x;
  let top = frame.y;
  let right = frame.x + frame.width;
  let bottom = frame.y + frame.height;

  if (direction.includes("w")) {
    left = clamp(frame.x + deltaX, WINDOW_EDGE_GAP, right - minimumWidth);
  }
  if (direction.includes("e")) {
    right = clamp(frame.x + frame.width + deltaX, left + minimumWidth, screenRight);
  }
  if (direction.includes("n")) {
    top = clamp(frame.y + deltaY, WINDOW_EDGE_GAP, bottom - minimumHeight);
  }
  if (direction.includes("s")) {
    bottom = clamp(frame.y + frame.height + deltaY, top + minimumHeight, screenBottom);
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
};
