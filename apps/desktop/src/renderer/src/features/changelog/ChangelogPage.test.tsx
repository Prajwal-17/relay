// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChangelogView } from "./ChangelogPage";

const markdown = `# Changelog

## v2.0.0 - 02 Jan 2026

### Features

- New workflow

## v1.0.0 — 01 Jan 2026

### Fixed

- First fix
`;

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({ matches: false })
  });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn()
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ChangelogView", () => {
  it("renders release content and navigates through the release index", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/changelog"]}>
        <ChangelogView markdown={markdown} />
      </MemoryRouter>
    );

    expect(screen.getByText("New workflow")).toBeVisible();
    expect(screen.getByRole("complementary", { name: "All releases" })).toBeVisible();

    const olderRelease = screen.getByRole("link", { name: /v1\.0\.0/ });
    await user.click(olderRelease);

    await waitFor(() => expect(olderRelease).toHaveAttribute("aria-current", "location"));
    await waitFor(() => expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled());
  });
});
