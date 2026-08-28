import { describe, expect, it } from "vitest";
import { getScrollTopForActiveRow, hasPointerMoved } from "./listNavigation";

describe("customer list navigation", () => {
  it("ignores pointer events at the same screen position", () => {
    const position = { x: 120, y: 340 };

    expect(hasPointerMoved(position, position)).toBe(false);
    expect(hasPointerMoved(position, { x: 121, y: 340 })).toBe(true);
  });

  it("scrolls only enough to reveal the keyboard-active row", () => {
    expect(
      getScrollTopForActiveRow({
        activeIndex: 2,
        rowHeight: 44,
        scrollTop: 132,
        clientHeight: 176
      })
    ).toBe(88);

    expect(
      getScrollTopForActiveRow({
        activeIndex: 8,
        rowHeight: 44,
        scrollTop: 132,
        clientHeight: 176
      })
    ).toBe(220);
  });

  it("does not scroll when the active row is already visible", () => {
    expect(
      getScrollTopForActiveRow({
        activeIndex: 5,
        rowHeight: 44,
        scrollTop: 132,
        clientHeight: 176
      })
    ).toBe(132);
  });
});
