import { ErrorState } from "@/components/app-ui/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCustomerActions } from "@/features/customers/customerActions";
import { useCustomerActivity } from "@/features/customers/hooks/useCustomerActivity";
import { useCustomerLedgerSummary } from "@/features/customers/hooks/useCustomerLedger";
import { useCustomerSummary } from "@/features/customers/hooks/useCustomerSummary";
import { useRecentSales } from "@/features/customers/hooks/useRecentSales";
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
import { MetricTile } from "../MetricTile";
import { SectionCard } from "../SectionCard";

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
  sale: "text-sales",
  estimate: "text-estimate",
  payment: "text-counter-accent",
  adjustment: "text-gold-accent-foreground",
  quick_sale: "text-counter-accent",
  opening_balance: "text-olive-accent"
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
  const summaryQuery = useCustomerSummary(customerId);
  const ledgerQuery = useCustomerLedgerSummary(customerId);
  const salesQuery = useRecentSales(customerId, RECENT_SALES_LIMIT);
  const activityQuery = useCustomerActivity(customerId, ACTIVITY_LIMIT);
  const summary = summaryQuery.summary;
  const ledgerSummary = ledgerQuery.summary;
  const recentSales = salesQuery.recentSales;
  const activity = activityQuery.activity;
  const { openPayment, openAdjust, openQuickSale } = useCustomerActions();

  const outstanding = ledgerSummary?.currentBalance ?? customer.outstandingBalance ?? 0;

  const salesTotal = summary?.salesTotal ?? 0;
  const salesCount = summary?.salesCount ?? 0;
  const estimatesCount = summary?.estimatesCount ?? 0;
  const avgInvoice = summary?.average ?? 0;

  const hasQueryError =
    summaryQuery.isError || ledgerQuery.isError || salesQuery.isError || activityQuery.isError;
  if (hasQueryError) {
    return (
      <ErrorState
        layout="page"
        title="Customer overview could not be loaded"
        description="The customer record is safe. Try loading the overview again."
        primaryAction={{
          label: "Try again",
          onClick: () =>
            void Promise.all([
              summaryQuery.refetch(),
              ledgerQuery.refetch(),
              salesQuery.refetch(),
              activityQuery.refetch()
            ]),
          loading:
            summaryQuery.isFetching ||
            ledgerQuery.isFetching ||
            salesQuery.isFetching ||
            activityQuery.isFetching
        }}
      />
    );
  }

  const isSettled = outstanding === 0;
  const isAdvance = outstanding < 0;

  const heroTone = isSettled
    ? "bg-hover text-muted-foreground border-border"
    : "bg-transparent text-foreground border-border";
  const heroLabel = isSettled ? "Settled" : isAdvance ? "Advance" : "Due";

  return (
    <div className="flex flex-col gap-3">
      <section className="bg-card border-border rounded-(--radius-panel) border">
        <div className="flex flex-col gap-3 px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
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
            <p className="financial-nums text-foreground font-semibold">
              {formatRupee(outstanding)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" className="cursor-pointer" onClick={openPayment}>
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

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
        {/* LEFT RAIL — Customer Info */}
        <div className="min-w-0">
          <SectionCard title="Customer Info">
            <dl className="divide-border/70 divide-y">
              <InfoRow label="Type" value={customer.customerType} />
              <InfoRow label="Contact" value={customer.contact} />
              <InfoRow label="Address" value={customer.address} />
              <InfoRow
                label="Member Since"
                value={customer.createdAt ? formatDateStr(customer.createdAt) : "—"}
              />
            </dl>
          </SectionCard>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <SectionCard title="Recent Sales" bodyClassName="p-0">
              {recentSales?.length === 0 ? (
                <div className="text-muted-foreground px-4 py-8 text-center text-sm">
                  No sales yet.
                </div>
              ) : (
                <ul className="divide-border/70 divide-y">
                  {recentSales?.map((sale) => (
                    <li
                      key={sale.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
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
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Recent Activity" bodyClassName="p-0">
              {activity?.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-8 text-center text-sm">
                  <CircleSlash className="size-5 opacity-50" />
                  No activity yet.
                </div>
              ) : (
                <ol className="px-3 py-2">
                  {activity?.map((event, idx) => {
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
                          {idx < activity?.length - 1 && (
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
