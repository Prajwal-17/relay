import { Card, type CardProps } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LedgerCard({ className, ...props }: CardProps) {
  return <Card className={cn("gap-0 overflow-hidden py-0", className)} {...props} />;
}
