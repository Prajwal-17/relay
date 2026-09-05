import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCustomerType } from "./customerType";

export function CustomerTypeBadge({
  customerType,
  className
}: {
  customerType: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-hover text-foreground border-border inline-flex shrink-0 items-center px-1.5 py-0 text-xs font-medium",
        className
      )}
    >
      <span>{formatCustomerType(customerType)}</span>
    </Badge>
  );
}
