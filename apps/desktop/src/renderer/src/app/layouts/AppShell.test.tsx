// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "./AppShell";

vi.mock("./BillingSidebar", () => ({ BillingSidebar: () => <nav>Billing navigation</nav> }));
vi.mock("./Sidebar", () => ({ Sidebar: () => <nav>Workspace navigation</nav> }));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
});

afterEach(() => cleanup());

function renderShell(pathname: string): HTMLElement {
  const { container } = render(
    <MemoryRouter initialEntries={[pathname]}>
      <AppShell />
    </MemoryRouter>
  );
  const workspace = container.querySelector<HTMLElement>("main > section");
  if (!workspace) throw new Error("App shell workspace was not rendered.");
  return workspace;
}

describe("AppShell workspace overflow", () => {
  it("clips the outer workspace on billing routes", () => {
    expect(renderShell("/billing/sales/create")).toHaveClass("overflow-clip");
  });

  it("keeps standard workspaces vertically scrollable", () => {
    expect(renderShell("/products")).toHaveClass("overflow-y-auto");
  });
});
