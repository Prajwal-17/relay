export type PointerPosition = {
  x: number;
  y: number;
};

export function hasPointerMoved(previous: PointerPosition | null, next: PointerPosition): boolean {
  return previous === null || previous.x !== next.x || previous.y !== next.y;
}

export function getScrollTopForActiveRow({
  activeIndex,
  rowHeight,
  scrollTop,
  clientHeight
}: {
  activeIndex: number;
  rowHeight: number;
  scrollTop: number;
  clientHeight: number;
}): number {
  const rowTop = activeIndex * rowHeight;
  const rowBottom = rowTop + rowHeight;

  if (rowTop < scrollTop) return rowTop;
  if (rowBottom > scrollTop + clientHeight) return rowBottom - clientHeight;
  return scrollTop;
}
