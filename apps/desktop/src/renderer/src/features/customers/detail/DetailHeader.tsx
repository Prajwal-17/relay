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
import type { CustomerMock } from "../_mock/types";
import { OutstandingBadge } from "./shared/OutstandingBadge";

const typeBadgeClass: Record<CustomerMock["customerType"], string> = {
  cash: "bg-muted text-muted-foreground border-border",
  account: "bg-info/15 text-info border-info/25",
  hotel: "bg-primary/10 text-primary border-primary/25"
};

export function DetailHeader({
  customer,
  onBack,
  onEdit,
  onRecordPayment,
  onOpenSearch
}: {
  customer: CustomerMock;
  onBack: () => void;
  onEdit: () => void;
  onRecordPayment: () => void;
  onOpenSearch: () => void;
}) {
  return (
    <header className="bg-card border-border flex shrink-0 flex-col gap-4 rounded-xl border px-5 py-4 shadow-xs">
      {/* Breadcrumb */}
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground hover:bg-accent flex w-fit cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-medium transition-colors"
      >
        <span aria-hidden>←</span>
        All Customers
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Identity */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenSearch}
              title="Switch customer"
              className="text-foreground hover:bg-accent flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors"
            >
              <h1 className="truncate text-2xl font-semibold tracking-[-0.02em]">
                {customer.name}
              </h1>
            </button>
            <Badge
              variant="outline"
              className={cn(
                "px-2.5 py-0.5 text-xs font-medium capitalize",
                typeBadgeClass[customer.customerType]
              )}
            >
              {customer.customerType}
            </Badge>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {customer.contact && <span className="font-medium">{customer.contact}</span>}
            {customer.gstin && (
              <span className="font-medium tabular-nums">GSTIN: {customer.gstin}</span>
            )}
          </div>
        </div>

        {/* Outstanding + actions */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Outstanding
            </span>
            <OutstandingBadge outstanding={customer.outstanding} />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" className="h-9 cursor-pointer" onClick={onEdit}>
              Edit
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 cursor-pointer">
                  Export
                  <span className="text-muted-foreground ml-0.5">▾</span>
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

            <Button variant="outline" className="h-9 cursor-pointer">
              New Sale
            </Button>

            <Button className="hover:bg-primary-hover h-9 cursor-pointer" onClick={onRecordPayment}>
              Record Payment
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
