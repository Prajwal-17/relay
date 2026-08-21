import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  BillingPersistenceContext,
  type ProtectedBillingAction
} from "@/features/billing/BillingPersistenceContext";
import { billingCoordinator } from "@/features/billing/store/billingCoordinator";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { billingSyncCoordinator } from "@/features/billing/syncWorker";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "QuickCart could not save the latest billing changes.";
}

export function BillingPersistenceGuard({ children }: { children: React.ReactNode }) {
  const hasSessions = useBillingSessionStore((state) => Object.keys(state.sessions).length > 0);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasSessions &&
      currentLocation.pathname.startsWith("/billing/") &&
      !nextLocation.pathname.startsWith("/billing/")
  );
  const [pendingAction, setPendingAction] = useState<ProtectedBillingAction | null>(null);
  const [message, setMessage] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);
  const activeActionRef = useRef<ProtectedBillingAction | null>(null);

  const restoreFocus = useCallback((action: ProtectedBillingAction | null) => {
    const origin = action?.origin;
    if (!origin?.isConnected) return;
    requestAnimationFrame(() => origin.focus());
  }, []);

  const closeDialog = useCallback(
    (restore = true) => {
      const action = activeActionRef.current;
      activeActionRef.current = null;
      setPendingAction(null);
      setMessage("");
      if (restore) restoreFocus(action);
    },
    [restoreFocus]
  );

  const runAfterSave = useCallback(
    async (action: ProtectedBillingAction) => {
      closeDialog(false);
      await action.afterSave();
    },
    [closeDialog]
  );

  const attemptSave = useCallback(
    async (action: ProtectedBillingAction, showDialog: boolean): Promise<boolean> => {
      try {
        await action.save();
      } catch (error) {
        console.error("Billing persistence guard stopped navigation", error);
        activeActionRef.current = action;
        setMessage(errorMessage(error));
        if (showDialog) setPendingAction(action);
        return false;
      }

      await runAfterSave(action);
      return true;
    },
    [runAfterSave]
  );

  const protect = useCallback(
    async (action: ProtectedBillingAction): Promise<boolean> => {
      const resolvedAction = {
        ...action,
        origin:
          action.origin ??
          (document.activeElement instanceof HTMLElement ? document.activeElement : null)
      };
      return attemptSave(resolvedAction, true);
    },
    [attemptSave]
  );

  useEffect(() => {
    if (blocker.state !== "blocked" || activeActionRef.current) return;
    const action: ProtectedBillingAction = {
      save: () => billingSyncCoordinator.flushAll(),
      afterSave: () => {
        billingCoordinator.removeAllTabs();
        blocker.proceed();
      },
      afterDiscard: () => {
        billingCoordinator.removeAllTabs({ discard: true });
        blocker.proceed();
      },
      onStay: () => blocker.reset(),
      origin: document.activeElement instanceof HTMLElement ? document.activeElement : null
    };
    void attemptSave(action, true);
  }, [attemptSave, blocker]);

  const handleRetry = async () => {
    if (!pendingAction) return;
    setIsRetrying(true);
    try {
      await attemptSave(pendingAction, true);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleStay = () => {
    const action = pendingAction;
    action?.onStay?.();
    closeDialog(true);
  };

  const handleDiscard = async () => {
    const action = pendingAction;
    if (!action) return;
    closeDialog(false);
    await action.afterDiscard();
  };

  return (
    <BillingPersistenceContext.Provider value={{ protect }}>
      {children}
      <AlertDialog open={Boolean(pendingAction)}>
        <AlertDialogContent
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            handleStay();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Billing changes were not saved</AlertDialogTitle>
            <AlertDialogDescription>
              {message} Stay here and retry, or explicitly discard the unsaved changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStay}>Stay on the page</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void handleRetry();
              }}
              disabled={isRetrying}
              aria-label="Retry save"
            >
              {isRetrying ? "Retrying…" : "Retry save"}
            </AlertDialogAction>
            <AlertDialogAction
              type="button"
              onClick={(event) => {
                event.preventDefault();
                void handleDiscard();
              }}
              disabled={isRetrying}
              aria-label="Discard unsaved changes"
              className="bg-destructive text-destructive-foreground"
            >
              Discard unsaved changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BillingPersistenceContext.Provider>
  );
}
