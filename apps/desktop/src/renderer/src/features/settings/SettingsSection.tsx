import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  resettableFieldsCount?: number;
  onResetSection?: () => void;
  isResetting?: boolean;
  children: ReactNode;
};

export const SettingsSection = ({
  title,
  description,
  resettableFieldsCount,
  onResetSection,
  isResetting,
  children
}: SettingsSectionProps) => {
  const canReset = resettableFieldsCount != null && onResetSection != null;

  return (
    <section className="border-frame bg-card rounded-(--radius-panel) border">
      <header className={description ? "border-border border-b px-4 py-3" : "px-4 py-3"}>
        <h2 className="text-foreground text-lg font-semibold tracking-[-0.02em]">{title}</h2>
        {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
      </header>

      <div className="divide-border divide-y px-4">{children}</div>

      {canReset ? (
        <footer className="border-border flex justify-end border-t px-4 py-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isResetting}>
                {isResetting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                Reset to defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Reset {resettableFieldsCount} field{resettableFieldsCount === 1 ? "" : "s"} to
                  defaults?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This restores the original values. Your changes will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onResetSection?.()}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </footer>
      ) : null}
    </section>
  );
};
