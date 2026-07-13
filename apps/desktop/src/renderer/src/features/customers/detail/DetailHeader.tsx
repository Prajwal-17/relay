import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCustomerActions } from "../CustomerActionsContext";
import type { CustomerMock } from "../_mock/types";
import { OutstandingBadge } from "./shared/OutstandingBadge";

const typeBadgeClass: Record<CustomerMock["customerType"], string> = {
  cash: "bg-muted text-muted-foreground border-border",
  account: "bg-info/15 text-info border-info/25",
  hotel: "bg-primary/10 text-primary border-primary/25"
};

// pinned slim tabs toolbar in customer workspace
export function DetailHeader({ customer }: { customer: CustomerMock }) {
  const navigate = useNavigate();
  const { openEditForm, openPayment, openSearch } = useCustomerActions();

  return (
    <header className="bg-background border-frame flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="text-muted-foreground hover:text-foreground hover:bg-accent flex shrink-0 cursor-pointer items-center rounded-md px-1.5 py-1 font-medium transition-colors"
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
            className="text-foreground hover:bg-accent flex min-w-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-lg font-semibold tracking-[-0.02em] transition-colors"
          >
            <span className="truncate">{customer.name}</span>
            <ChevronDown className="text-foreground size-5 shrink-0" />
          </button>
        </nav>

        <Badge
          variant="outline"
          className={cn(
            "shrink-0 px-2 py-0.5 text-xs font-medium capitalize",
            typeBadgeClass[customer.customerType]
          )}
        >
          {customer.customerType}
        </Badge>

        <OutstandingBadge outstanding={customer.outstanding} size="md" className="shrink-0" />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" className="cursor-pointer" onClick={openEditForm}>
          Edit
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer">
              Export
              <ChevronDown className="text-muted-foreground ml-0.5 size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-semibold uppercase">
              Export
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">Statement PDF</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Statement Excel</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">Ledger</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Invoices</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Payments</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => navigate("/billing/sales/create")}
        >
          New Sale
        </Button>

        <Button
          size="sm"
          className="hover:bg-primary-hover cursor-pointer"
          onClick={openPayment}
        >
          Record Payment
        </Button>
      </div>
    </header>
  );
}
