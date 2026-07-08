import { Badge } from "@/components/ui/badge";
import { SectionCard } from "../shared/SectionCard";
import { MetricTile } from "../shared/MetricTile";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { CalendarClock, FileClock, Receipt, ShoppingCart, TrendingUp } from "lucide-react";
import type { CustomerMock } from "../../_mock/types";
import { mockActivity, mockEstimates, mockNotes, mockSales } from "../../_mock/data";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground text-sm font-medium break-words">{value || "—"}</dd>
    </div>
  );
}

export function OverviewTab({ customer }: { customer: CustomerMock }) {
  const pendingEstimates = mockEstimates.filter((e) => e.status === "unpaid").length;
  const avgInvoice =
    mockSales.length > 0
      ? Math.round(mockSales.reduce((s, x) => s + x.amount, 0) / mockSales.length)
      : 0;
  const recentSales = mockSales.slice(0, 5);
  const recentActivity = mockActivity.slice(0, 4);
  const pinnedNote = mockNotes.find((n) => n.pinned);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {/* Left 25% — customer info + quick notes */}
      <div className="flex flex-col gap-4 lg:col-span-1">
        <SectionCard title="Customer Info">
          <dl className="divide-border/70 divide-y">
            <InfoRow label="Type" value={customer.customerType} />
            <InfoRow label="Contact" value={customer.contact} />
            <InfoRow label="GSTIN" value={customer.gstin} />
            <InfoRow label="Billing" value={customer.billingAddress} />
            <InfoRow
              label="Member Since"
              value={customer.createdAt ? formatDateStr(customer.createdAt) : "—"}
            />
            <InfoRow label="Credit Limit" value={formatRupee(customer.creditLimit)} />
          </dl>
        </SectionCard>

        <SectionCard title="Quick Note">
          {pinnedNote ? (
            <div>
              <p className="text-foreground text-sm font-medium">{pinnedNote.body}</p>
              <p className="text-muted-foreground mt-2 text-xs font-medium">
                — {pinnedNote.author}, {formatDateStr(pinnedNote.date)}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No pinned notes.</p>
          )}
        </SectionCard>
      </div>

      {/* Right 75% — metrics + recent sales + activity */}
      <div className="flex flex-col gap-4 lg:col-span-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricTile
            label="Total Sales"
            value={formatRupee(customer.totalSales)}
            icon={<ShoppingCart className="size-3.5" />}
          />
          <MetricTile
            label="Pending Estimates"
            value={String(pendingEstimates)}
            icon={<FileClock className="size-3.5" />}
          />
          <MetricTile
            label="Avg Invoice"
            value={formatRupee(avgInvoice)}
            icon={<TrendingUp className="size-3.5" />}
          />
          <MetricTile
            label="Last Purchase"
            value={customer.lastPurchase ? formatDateStr(customer.lastPurchase) : "—"}
            icon={<CalendarClock className="size-3.5" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <SectionCard title="Recent Sales" className="xl:col-span-2" bodyClassName="p-0">
            <ul className="divide-border/70 divide-y">
              {recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Receipt className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-sm font-medium tabular-nums">
                        {sale.invoiceNo}
                      </p>
                      <p className="text-muted-foreground text-xs font-medium">
                        {formatDateStr(sale.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-foreground text-sm font-semibold tabular-nums">
                      {formatRupee(sale.amount)}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        sale.status === "paid"
                          ? "bg-success/15 text-success border-success/25 px-2 py-0.5 text-xs font-medium capitalize"
                          : "bg-warning/15 text-warning border-warning/30 px-2 py-0.5 text-xs font-medium capitalize"
                      }
                    >
                      {sale.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Recent Activity" bodyClassName="p-0">
            <ol className="px-4 py-2">
              {recentActivity.map((event, idx) => (
                <li key={event.id} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className="bg-primary/15 text-primary flex size-3.5 shrink-0 items-center justify-center rounded-full" />
                    {idx < recentActivity.length - 1 && (
                      <span className="bg-border mt-1 w-px flex-1" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground text-sm font-medium">{event.title}</p>
                    <p className="text-muted-foreground line-clamp-2 text-xs font-medium">
                      {event.description}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs font-medium">
                      {formatDateStr(event.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
