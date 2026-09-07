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

    expect(screen.getByRole("alert")).toHaveTextContent("Relay needs to reload");
    expect(screen.getByRole("button", { name: "Reload Relay" })).toBeVisible();
  });

  it("keeps the shell mounted when a workspace route crashes", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const router = createMemoryRouter([
      {
        path: "/",
        element: (
          <div>
            <nav>Relay navigation</nav>
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

    expect(await screen.findByText("Relay navigation")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("This page could not be displayed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Return home" })).toBeVisible();
  });
});
