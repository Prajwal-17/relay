import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CUSTOMER_DETAIL_TAB, type CustomerDetailTab } from "@/types/renderer.types";
import type { Customer } from "@shared/types";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomerActions } from "../customerActions";
import { OutstandingBadge } from "./OutstandingBadge";

const typeBadgeClass: Record<string, string> = {
  cash: "bg-hover text-foreground border-border",
  account: "bg-hover text-foreground border-border",
  hotel: "bg-hover text-foreground border-border"
};

// pinned slim tabs toolbar in customer workspace
export function DetailHeader({
  customer,
  activeTab
}: {
  customer: Customer;
  activeTab: CustomerDetailTab;
}) {
  const navigate = useNavigate();
  const { openEditForm, openPayment, openSearch } = useCustomerActions();

  return (
    <header className="bg-background border-frame flex h-(--app-header-height) shrink-0 items-center justify-between gap-3 border-b px-3">
      <div className="flex min-w-0 items-center gap-2">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="text-muted-foreground hover:text-foreground hover:bg-hover focus-visible:ring-ring flex shrink-0 cursor-pointer items-center rounded-(--radius-control) px-1.5 py-1 font-medium transition-colors outline-none focus-visible:ring-2"
          >
            All customers
          </button>
          <span className="text-muted-foreground/60 shrink-0 select-none" aria-hidden>
            /
          </span>
          <button
            type="button"
            onClick={openSearch}
            title="Switch customer"
            aria-current="page"
            className="text-foreground hover:bg-hover focus-visible:ring-ring flex min-w-0 cursor-pointer items-center gap-1 rounded-(--radius-control) px-1.5 py-1 text-lg font-semibold tracking-[-0.02em] transition-colors outline-none focus-visible:ring-2"
          >
            <span className="truncate">{customer.name}</span>
            <ChevronDown className="text-foreground size-5 shrink-0" />
          </button>
        </nav>

        <Badge
          variant="outline"
          className={cn(
            "shrink-0 px-2 py-0.5 text-xs font-medium capitalize",
            typeBadgeClass[customer.customerType] ?? typeBadgeClass.cash
          )}
        >
          {customer.customerType}
        </Badge>

        {activeTab !== CUSTOMER_DETAIL_TAB.ACCOUNTING && (
          <OutstandingBadge
            outstanding={customer.outstandingBalance ?? 0}
            size="md"
            className="shrink-0"
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" className="cursor-pointer" onClick={openEditForm}>
          Edit
        </Button>

        <Button
          size="sm"
          className="cursor-pointer"
          onClick={() =>
            navigate("/billing/sales/create", {
              state: { prefillCustomer: { id: customer.id, name: customer.name } }
            })
          }
        >
          New Sale
        </Button>

        <Button size="sm" className="cursor-pointer" onClick={openPayment}>
          Record Payment
        </Button>
      </div>
    </header>
  );
}
