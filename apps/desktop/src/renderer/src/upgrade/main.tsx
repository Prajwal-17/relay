import { Button } from "@/components/ui/button";
import quickcartLogo from "@/assets/quickcart.svg";
import type { DatabaseUpgradeStatus } from "@shared/types";
import { CircleAlert, FolderOpen, Power, RotateCcw } from "lucide-react";
import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";

const initialStatus: DatabaseUpgradeStatus = {
  state: "checking",
  label: "Checking your local database",
  currentStep: 0,
  totalSteps: 1,
  backupAvailable: false
};

export function UpgradeSplash() {
  const [status, setStatus] = useState(initialStatus);
  const [actionError, setActionError] = useState<string>();
  const isFresh = new URLSearchParams(window.location.search).get("kind") === "fresh";
  const isFailed = status.state === "failed";
  const stepCount = Math.max(1, status.totalSteps);
  const steps = useMemo(() => Array.from({ length: stepCount }), [stepCount]);

  useEffect(() => {
    let mounted = true;
    window.databaseUpgradeApi.getStatus().then((nextStatus) => {
      if (mounted && nextStatus) setStatus(nextStatus);
    });
    const unsubscribe = window.databaseUpgradeApi.onStatus(setStatus);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function runAction(action: () => Promise<void>) {
    setActionError(undefined);
    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The action could not be completed.");
    }
  }

  return (
    <main className="bg-background text-foreground border-borderprimary flex h-screen min-h-0 flex-col overflow-hidden border">
      <header className="border-border bg-card flex h-12 shrink-0 items-center gap-2.5 border-b px-4 text-sm font-semibold tracking-tight">
        <img src={quickcartLogo} alt="" className="size-7 shrink-0" />
        <span>QuickCart</span>
      </header>

      <section
        className="flex min-h-0 flex-1 flex-col justify-between gap-6 overflow-y-auto p-6"
        aria-labelledby="upgrade-title"
      >
        <div className="max-w-lg">
          <p className="text-muted-foreground mb-2 text-xs font-semibold">Local database</p>
          <h1 id="upgrade-title" className="text-foreground mb-2 text-lg leading-tight font-bold">
            {isFailed
              ? "QuickCart could not update."
              : isFresh
                ? "Preparing QuickCart."
                : "Updating QuickCart."}
          </h1>
          <p className="text-muted-foreground max-w-[58ch] text-sm leading-6">
            {isFailed
              ? "Your original data is still safe. Retry the update, open the backup folder, or quit QuickCart."
              : "Keep QuickCart open while your records are made ready for this version."}
          </p>
        </div>

        {isFailed ? (
          <div className="grid gap-3" role="alert">
            <div className="border-destructive bg-card flex max-h-32 gap-2.5 overflow-y-auto rounded-(--radius-control) border p-3">
              <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="text-destructive min-w-0 text-xs leading-5 break-words whitespace-pre-wrap select-text">
                {status.errorMessage ?? "The database update failed."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => runAction(() => window.databaseUpgradeApi.retry())}>
                <RotateCcw />
                Retry
              </Button>
              <Button
                variant="outline"
                disabled={!status.backupAvailable}
                onClick={() => runAction(() => window.databaseUpgradeApi.openBackupFolder())}
              >
                <FolderOpen />
                Open backup folder
              </Button>
              <Button variant="ghost" onClick={() => window.databaseUpgradeApi.quit()}>
                <Power />
                Quit
              </Button>
            </div>

            {actionError ? (
              <p className="text-destructive text-xs leading-5">{actionError}</p>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3" aria-live="polite" aria-atomic="true">
            <div className="flex w-full gap-1" aria-hidden="true">
              {steps.map((_, index) => {
                const step = index + 1;
                const isComplete = step < status.currentStep;
                const isCurrent = step === status.currentStep;

                return (
                  <span
                    className={`h-1 flex-1 rounded-sm ${
                      isComplete
                        ? "bg-primary"
                        : isCurrent
                          ? "bg-marker animate-pulse"
                          : "bg-border"
                    }`}
                    key={step}
                  />
                );
              })}
            </div>
            <div className="text-muted-foreground flex items-start justify-between gap-4 text-xs tabular-nums">
              <span className="text-foreground min-w-0 leading-5 font-medium break-words">
                {status.label}
              </span>
              <span className="shrink-0 leading-5">
                Step {Math.min(status.currentStep, stepCount)} of {stepCount}
              </span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("upgrade-root")!).render(
  <StrictMode>
    <UpgradeSplash />
  </StrictMode>
);
