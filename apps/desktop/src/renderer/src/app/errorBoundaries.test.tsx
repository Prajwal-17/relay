// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

const Broken = () => {
  throw new Error("render failed");
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("renderer crash boundaries", () => {
  it("shows an accessible full-app reload fallback", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <Broken />
      </AppErrorBoundary>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("QuickCart needs to reload");
    expect(screen.getByRole("button", { name: "Reload QuickCart" })).toBeVisible();
  });

  it("keeps the shell mounted when a workspace route crashes", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const router = createMemoryRouter([
      {
        path: "/",
        element: (
          <div>
            <nav>QuickCart navigation</nav>
            <Outlet />
          </div>
        ),
        children: [
          {
            index: true,
            element: <Broken />,
            errorElement: <RouteErrorBoundary scope="workspace" />
          }
        ]
      }
    ]);

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("QuickCart navigation")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("This page could not be displayed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Return home" })).toBeVisible();
  });
});
