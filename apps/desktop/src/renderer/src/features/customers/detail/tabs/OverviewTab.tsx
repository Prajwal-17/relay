import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCustomerActions } from "@/features/customers/customerActions";
import { useCustomerActivity } from "@/hooks/customers/useCustomerActivity";
import { useCustomerLedgerSummary } from "@/hooks/customers/useCustomerLedger";
import { useCustomerSummary } from "@/hooks/customers/useCustomerSummary";
import { useRecentSales } from "@/hooks/customers/useRecentSales";
import { cn } from "@/lib/utils";
import type { ActivityKind, Customer } from "@shared/types";
import { formatDateStr, formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import {
  CircleSlash,
  CreditCard,
  FileClock,
  FileText,
  Plus,
  Receipt,
  Scale,
  ShoppingCart,
  SlidersHorizontal,
  TrendingUp,
  Wallet,
  type LucideIcon
} from "lucide-react";
import { MetricTile } from "../shared/MetricTile";
import { SectionCard } from "../shared/SectionCard";

const ACTIVITY_LIMIT = 5;
const RECENT_SALES_LIMIT = 5;

const kindIcon: Record<ActivityKind, LucideIcon> = {
  sale: Receipt,
  estimate: FileText,
  payment: CreditCard,
  adjustment: Scale,
  quick_sale: Plus,
  opening_balance: Wallet
};

const kindIconClass: Record<ActivityKind, string> = {
  sale: "text-info",
  estimate: "text-primary",
  payment: "text-success",
  adjustment: "text-muted-foreground",
  quick_sale: "text-warning",
  opening_balance: "text-muted-foreground"
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground wrap-break-words text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

export function OverviewTab({ customerId, customer }: { customerId: string; customer: Customer }) {
  const { summary } = useCustomerSummary(customerId);
  const { summary: ledgerSummary } = useCustomerLedgerSummary(customerId);
  const { recentSales } = useRecentSales(customerId, RECENT_SALES_LIMIT);
  const { activity } = useCustomerActivity(customerId, ACTIVITY_LIMIT);
  const { openPayment, openAdjust, openQuickSale } = useCustomerActions();

  const outstanding = ledgerSummary?.currentBalance ?? customer.outstandingBalance ?? 0;
  const creditLimit = customer.creditLimit ?? 0;

  const salesTotal = summary?.salesTotal ?? 0;
  const salesCount = summary?.salesCount ?? 0;
  const estimatesCount = summary?.estimatesCount ?? 0;
  const avgInvoice = summary?.average ?? 0;

  const isSettled = outstanding === 0;
  const isOverLimit = creditLimit > 0 && outstanding > creditLimit;
  const usagePct =
    creditLimit > 0 ? Math.min(100, Math.round((Math.max(0, outstanding) / creditLimit) * 100)) : 0;

  const heroTone = isOverLimit
    ? "bg-destructive/10 text-destructive border-destructive/25"
    : isSettled
      ? "bg-success/15 text-success border-success/25"
      : "bg-warning/15 text-warning border-warning/30";
  const heroLabel = isOverLimit ? "Over limit" : isSettled ? "Settled" : "Due";

  return (
    <div className="flex flex-col gap-4">
      <section className="bg-card border-border rounded-xl border shadow-xs">
        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Outstanding Balance
              </span>
              <Badge
                variant="outline"
                className={cn("px-2 py-0.5 text-xs font-semibold capitalize", heroTone)}
              >
                {heroLabel}
              </Badge>
            </div>
            <p className="text-foreground text-2xl font-semibold tracking-[-0.02em] tabular-nums">
              {formatRupee(outstanding)}
            </p>
            {creditLimit > 0 && (
              <div className="flex flex-col gap-1">
                <div className="bg-muted h-1.5 w-56 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isOverLimit ? "bg-destructive" : "bg-primary"
                    )}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs font-medium tabular-nums">
                  {usagePct}% of {formatRupee(creditLimit)} credit limit
                </p>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              className="hover:bg-primary-hover cursor-pointer"
              onClick={openPayment}
            >
              <CreditCard className="size-4" />
              Payment
            </Button>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={openAdjust}>
              <SlidersHorizontal className="size-4" />
              Adjust
            </Button>
            <Button variant="ghost" size="sm" className="cursor-pointer" onClick={openQuickSale}>
              <Plus className="size-4" />
              Quick Sale
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* LEFT RAIL — Customer Info */}
        <div className="lg:col-span-1">
          <SectionCard title="Customer Info">
            <dl className="divide-border/70 divide-y">
              <InfoRow label="Type" value={customer.customerType} />
              <InfoRow label="Contact" value={customer.contact} />
              <InfoRow label="Address" value={customer.address} />
              <InfoRow
                label="Member Since"
                value={customer.createdAt ? formatDateStr(customer.createdAt) : "—"}
              />
              <InfoRow label="Credit Limit" value={formatRupee(creditLimit)} />
            </dl>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricTile
              label="Total Sales"
              value={formatRupee(salesTotal)}
              icon={<ShoppingCart className="size-4" />}
            />
            <MetricTile
              label="Total Invoices"
              value={String(salesCount)}
              icon={<Receipt className="size-4" />}
            />
            <MetricTile
              label="Estimates"
              value={String(estimatesCount)}
              icon={<FileClock className="size-4" />}
            />
            <MetricTile
              label="Avg Invoice"
              value={formatRupee(avgInvoice)}
              icon={<TrendingUp className="size-4" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SectionCard title="Recent Sales" bodyClassName="p-0">
              {recentSales.length === 0 ? (
                <div className="text-muted-foreground px-4 py-8 text-center text-sm">
                  No sales yet.
                </div>
              ) : (
                <ul className="divide-border/70 divide-y">
                  {recentSales.map((sale) => (
                    <li
                      key={sale.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Receipt className="text-primary size-5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-foreground truncate text-sm font-medium tabular-nums">
                            #{sale.invoiceNo}
                          </p>
                          <p className="text-muted-foreground text-xs font-medium">
                            {formatDateStr(sale.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-foreground text-sm font-semibold tabular-nums">
                          {formatRupee(sale.grandTotal)}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            sale.isPaid
                              ? "bg-success/15 text-success border-success/25 px-2 py-0.5 text-xs font-medium capitalize"
                              : "bg-warning/15 text-warning border-warning/30 px-2 py-0.5 text-xs font-medium capitalize"
                          }
                        >
                          {sale.isPaid ? "Paid" : "Unpaid"}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Recent Activity" bodyClassName="p-0">
              {activity.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
                  <CircleSlash className="size-5 opacity-50" />
                  No activity yet.
                </div>
              ) : (
                <ol className="px-4 py-2">
                  {activity.map((event, idx) => {
                    const Icon = kindIcon[event.kind] ?? CircleSlash;
                    return (
                      <li key={event.id} className="flex gap-3 pb-4 last:pb-0">
                        <div className="flex flex-col items-center">
                          <Icon
                            className={cn(
                              "size-4.5 shrink-0",
                              kindIconClass[event.kind] ?? "text-muted-foreground"
                            )}
                          />
                          {idx < activity.length - 1 && (
                            <span className="bg-border mt-1 w-px flex-1" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground text-sm font-medium">{event.title}</p>
                          <p className="text-muted-foreground line-clamp-2 text-xs font-medium">
                            {event.description}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-xs font-medium tabular-nums">
                            {formatDateStrToISTDateTimeStr(event.date)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
