import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * Centered placeholder for sparse/empty tabs.
 */
export function EmptyTab({
  icon: Icon,
  title,
  description,
  action,
  className
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-64 flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <span className="bg-muted text-muted-foreground mb-5 flex size-12 items-center justify-center rounded-xl">
          <Icon className="size-6" />
        </span>
      )}
      <h3 className="text-foreground text-base font-semibold tracking-[-0.02em]">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
