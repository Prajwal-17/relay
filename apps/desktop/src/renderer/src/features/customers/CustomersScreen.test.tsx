// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/apiClient";
import { CustomersScreen } from "./CustomersScreen";

const useCustomerMock = vi.hoisted(() => vi.fn());

vi.mock("./hooks/useCustomer", () => ({
  useCustomer: useCustomerMock
}));

describe("customer detail errors", () => {
  it("treats an invalid customer ID as not found", () => {
    useCustomerMock.mockReturnValue({
      customer: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError("Invalid customer ID", 400),
      refetch: vi.fn(),
      isFetching: false
    });

    render(
      <MemoryRouter initialEntries={["/customers/not-a-uuid"]}>
        <Routes>
          <Route path="/customers/:customerId" element={<CustomersScreen />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Customer not found");
    expect(screen.getByRole("alert")).toHaveTextContent("This customer does not exist.");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to customers" })).toBeVisible();
  });
});
