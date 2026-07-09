import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CustomerMock } from "../_mock/types";
import { OutstandingBadge } from "../detail/shared/OutstandingBadge";

const typeBadgeClass: Record<CustomerMock["customerType"], string> = {
  cash: "bg-muted text-muted-foreground border-border",
  account: "bg-info/15 text-info border-info/25",
  hotel: "bg-primary/10 text-primary border-primary/25"
};

export function CustomerListRow({
  customer
}: {
  customer: CustomerMock;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/customers/${customer.id}`)}
      className={cn(
        "border-border/70 hover:bg-accent grid w-full cursor-pointer grid-cols-12 items-center gap-2",
        "border-b px-4 py-3 text-left transition-colors last:border-b-0"
      )}
    >
      <div className="col-span-4 min-w-0">
        <p className="text-foreground truncate font-medium">{customer.name}</p>
        <p className="text-muted-foreground truncate text-xs">{customer.contact ?? "No contact"}</p>
      </div>

      <div className="col-span-2 flex items-center">
        <Badge
          variant="outline"
          className={cn(
            "px-2 py-0.5 text-xs font-medium capitalize",
            typeBadgeClass[customer.customerType]
          )}
        >
          {customer.customerType}
        </Badge>
      </div>

      <div className="col-span-3 flex items-center">
        <OutstandingBadge outstanding={customer.outstanding} />
      </div>

      <div className="text-foreground col-span-2 flex items-center justify-end font-medium tabular-nums">
        {customer.totalSales > 0 ? (
          formatRupee(customer.totalSales)
        ) : (
          <span className="text-muted-foreground/60 flex items-center gap-1 text-xs font-medium">
            <Inbox className="size-3.5" />
            No sales
          </span>
        )}
      </div>

      <div className="text-muted-foreground col-span-1 flex items-center justify-end text-xs font-medium tabular-nums">
        {customer.lastPurchase ? formatDateStr(customer.lastPurchase) : "—"}
      </div>
    </button>
  );
}
