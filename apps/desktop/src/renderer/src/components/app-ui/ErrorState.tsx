import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

export type ErrorStateLayout = "compact" | "panel" | "page";

export type ErrorStateProps = {
  title: string;
  description: string;
  layout?: ErrorStateLayout;
  primaryAction?: { label: string; onClick: () => void; loading?: boolean };
  secondaryAction?: { label: string; onClick: () => void };
  icon?: ReactNode;
  className?: string;
};

export const ErrorState = ({
  title,
  description,
  layout = "panel",
  primaryAction,
  secondaryAction,
  icon,
  className
}: ErrorStateProps) => (
  <div
    role="alert"
    aria-live="assertive"
    className={cn(
      "border-border bg-card text-foreground flex min-w-0 flex-col items-center justify-center text-center",
      layout === "compact" && "gap-2 rounded-(--radius-control) border p-3",
      layout === "panel" && "min-h-40 gap-3 rounded-(--radius-panel) border p-4",
      layout === "page" && "h-full min-h-64 w-full gap-3 p-6",
      className
    )}
  >
    <span className="bg-destructive/10 text-destructive flex size-9 shrink-0 items-center justify-center rounded-(--radius-control)">
      {icon ?? <AlertTriangle className="size-4.5" aria-hidden="true" />}
    </span>
    <div className="max-w-md min-w-0">
      <h2 className="text-base font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
    </div>
    {(primaryAction || secondaryAction) && (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {primaryAction && (
          <Button
            type="button"
            size="sm"
            onClick={primaryAction.onClick}
            disabled={primaryAction.loading}
          >
            <RotateCcw className={cn("size-4", primaryAction.loading && "animate-spin")} />
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button type="button" size="sm" variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    )}
  </div>
);
