import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Card wrapper with a title + optional action slot.
 * Follows E2 card tokens: bg-card border-border shadow-xs rounded-xl.
 */
type SectionCardProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

export function SectionCard({
  title,
  description,
  action,
  className,
  bodyClassName,
  children
}: SectionCardProps) {
  return (
    <section className={cn("bg-card border-border shadow-xs rounded-xl border", className)}>
      {(title || action) && (
        <header className="border-border/70 flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            {title && <h3 className="text-foreground font-semibold tracking-[-0.02em]">{title}</h3>}
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
