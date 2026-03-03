import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCustomerSummary } from "@/hooks/customers/useCustomerSummary";
import type { Customer } from "@shared/types";
import { formatToRupees } from "@shared/utils/utils";
import { ReceiptText, ShoppingCart, TrendingUp } from "lucide-react";

type Props = {
  customer: Customer;
};

const SummaryMetricCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  iconBg,
  iconColor
}: {
  title: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) => (
  <div className="border-border/50 bg-background flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-center gap-2">
      <span className={`flex items-center justify-center rounded-lg p-1.5 ${iconBg}`}>
        <Icon size={15} strokeWidth={2} className={iconColor} />
      </span>
      <span className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
        {title}
      </span>
    </div>
    <p className="text-foreground text-2xl font-bold">{value}</p>
    <p className="text-muted-foreground text-sm font-medium">{subValue}</p>
  </div>
);

const Ske = ({ className }: { className: string }) => (
  <div className={`bg-muted animate-pulse rounded-md ${className}`} />
);

const LoadingSkeleton = () => (
  <div className="grid grid-cols-3 gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border-border/50 flex flex-col gap-2 rounded-xl border p-4">
        <Ske className="h-4 w-24" />
        <Ske className="h-8 w-32" />
        <Ske className="h-3 w-20" />
      </div>
    ))}
  </div>
);

export const CustomerSummaryCard = ({ customer }: Props) => {
  const { summary, status } = useCustomerSummary(customer.id);

  const totalTransactions = (summary?.salesCount ?? 0) + (summary?.estimatesCount ?? 0);

  return (
    <Card className="mb-3 h-57.5 gap-0 rounded-xl px-5 py-4 shadow-sm">
      <CardHeader className="p-0 pb-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-foreground text-lg font-semibold">Customer Summary</h2>
          <p className="text-muted-foreground text-sm">Financial overview and activity</p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {status === "pending" ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <SummaryMetricCard
              title="Total Sales"
              value={formatToRupees(summary?.salesTotal ?? 0)}
              subValue={`${summary?.salesCount ?? 0} Transactions`}
              icon={ShoppingCart}
              iconBg="bg-primary/15"
              iconColor="text-primary-foreground"
            />
            <SummaryMetricCard
              title="Estimates"
              value={formatToRupees(summary?.estimatesTotal ?? 0)}
              subValue={`${summary?.estimatesCount ?? 0} Quotations`}
              icon={ReceiptText}
              iconBg="bg-secondary"
              iconColor="text-secondary-foreground"
            />
            <SummaryMetricCard
              title="Avg. Transaction"
              value={formatToRupees(summary?.average ?? 0)}
              subValue={`Across ${totalTransactions} transactions`}
              icon={TrendingUp}
              iconBg="bg-success/15"
              iconColor="text-success"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
