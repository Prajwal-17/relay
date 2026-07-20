import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

type SettingsFieldProps = {
  label: string;
  hint?: string;
  defaultValue?: ReactNode;
  onReset?: () => void;
  isResetting?: boolean;
  children: ReactNode;
};

export const SettingsField = ({
  label,
  hint,
  defaultValue,
  onReset,
  isResetting,
  children
}: SettingsFieldProps) => {
  const showReset = onReset != null;
  const showMeta = defaultValue != null || showReset;

  return (
    <div className="grid gap-3 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] lg:items-start">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label className="text-foreground text-base font-medium">{label}</Label>
        </div>
        {hint ? <p className="text-muted-foreground text-sm">{hint}</p> : null}
      </div>

      <div className="w-full space-y-2">
        {children}
        {showMeta ? (
          <div className="flex items-center justify-between gap-2">
            {defaultValue != null ? (
              <span className="bg-muted text-muted-foreground inline-flex min-w-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium">
                <span className="shrink-0">Default:</span>
                <span className="truncate">{defaultValue}</span>
              </span>
            ) : (
              <span />
            )}
            {showReset ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 shrink-0 gap-1.5 px-2.5 text-xs font-medium"
                onClick={onReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                Reset
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
