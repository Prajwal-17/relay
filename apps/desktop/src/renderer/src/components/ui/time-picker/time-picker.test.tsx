// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimePicker, TimePickerClear } from ".";

afterEach(cleanup);

describe("TimePicker", () => {
  it("does not report controlled prop updates as user changes", () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <TimePicker
        value="09:15"
        open={false}
        onValueChange={onValueChange}
        onOpenChange={onOpenChange}
      >
        <TimePickerClear>Clear</TimePickerClear>
      </TimePicker>
    );

    rerender(
      <TimePicker
        value="14:30"
        open
        onValueChange={onValueChange}
        onOpenChange={onOpenChange}
      >
        <TimePickerClear>Clear</TimePickerClear>
      </TimePicker>
    );

    expect(onValueChange).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onValueChange).toHaveBeenCalledWith("");
  });
});
