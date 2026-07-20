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
  description: string;
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
    <section className="border-border bg-card rounded-xl border shadow-xs">
      <header className="border-border/70 border-b px-6 py-5">
        <h2 className="text-foreground text-xl font-semibold tracking-[-0.02em]">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </header>

      <div className="divide-border/70 divide-y px-6">{children}</div>

      {canReset ? (
        <footer className="border-border/70 flex justify-end border-t px-6 py-4">
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
