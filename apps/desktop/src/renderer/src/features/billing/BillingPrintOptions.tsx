import { UpiAccountPicker } from "@/components/app-ui/UpiAccountPicker";
import {
  ReceiptQrModeSelector,
  type ReceiptQrMode
} from "@/features/billing/ReceiptQrModeSelector";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { useAppPreferences } from "@/features/preferences/useAppPreferences";
import { TRANSACTION_TYPE } from "@shared/types";
import {
  getDefaultUpiQrProfile,
  orderUpiQrProfiles,
  resolveUpiQrProfile
} from "@shared/utils/upiQrProfiles";
import { roundPaisaToNearestRupee } from "@shared/utils/utils";
import { useEffect } from "react";

export function BillingPrintOptions() {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const updatePrintOption = useBillingSessionStore((state) => state.updatePrintOption);
  const { config, defaults } = useAppPreferences();

  const printing = config?.printing ?? defaults?.printing;
  const storedUpiOption = session?.printOptions.includeUpiQr ?? null;
  const storedAmountOption = session?.printOptions.includeAmountInUpiQr ?? null;
  const storedUpiProfileId = session?.printOptions.selectedUpiQrProfileId ?? null;
  const billingType = session?.billingType;

  const orderedUpiProfiles = printing ? orderUpiQrProfiles(printing) : [];
  const selectedUpiProfile = printing
    ? (resolveUpiQrProfile(printing, storedUpiProfileId) ?? getDefaultUpiQrProfile(printing))
    : undefined;
  const upiIsReady = Boolean(selectedUpiProfile);
  const defaultUpiQr = printing
    ? billingType === TRANSACTION_TYPE.SALE
      ? printing.printUpiQrOnSales
      : printing.printUpiQrOnEstimates
    : false;
  const includeUpiQr = upiIsReady && (storedUpiOption ?? defaultUpiQr);
  const includeAmountInUpiQr =
    includeUpiQr && (storedAmountOption ?? printing?.includeAmountInUpiQr ?? true);
  const receiptQrMode: ReceiptQrMode = !includeUpiQr
    ? "receipt"
    : includeAmountInUpiQr
      ? "upi-exact"
      : "upi-open";
  const currentBillPaisa = roundPaisaToNearestRupee(
    (session?.lineItems ?? []).reduce(
      (total, item) => total + (!item.isDeleted && item.totalPrice > 0 ? item.totalPrice : 0),
      0
    )
  );

  useEffect(() => {
    if (!activeTabId || !session || !printing) return;

    if (
      session.printOptions.selectedUpiQrProfileId &&
      !printing.upiQrProfiles.some(
        (profile) => profile.id === session.printOptions.selectedUpiQrProfileId
      )
    ) {
      updatePrintOption(activeTabId, "selectedUpiQrProfileId", null);
    }
    if (!upiIsReady) {
      if (session.printOptions.includeUpiQr !== false) {
        updatePrintOption(activeTabId, "includeUpiQr", false);
      }
      if (session.printOptions.includeAmountInUpiQr !== false) {
        updatePrintOption(activeTabId, "includeAmountInUpiQr", false);
      }
    }
  }, [activeTabId, printing, session, updatePrintOption, upiIsReady]);

  if (!activeTabId || !session) return null;

  const handleReceiptQrModeChange = (mode: ReceiptQrMode) => {
    updatePrintOption(activeTabId, "includeUpiQr", mode !== "receipt");
    updatePrintOption(activeTabId, "includeAmountInUpiQr", mode === "upi-exact");
  };

  const handleUpiProfileChange = (profileId: string) => {
    updatePrintOption(activeTabId, "selectedUpiQrProfileId", profileId);
    updatePrintOption(activeTabId, "includeUpiQr", true);
  };

  return (
    <section aria-label="Bill options" className="min-w-0">
      <fieldset className="min-w-0">
        <legend className="sr-only">Bill options</legend>

        <div>
          <div className="space-y-2 px-2 py-2.5">
            <ReceiptQrModeSelector
              id={`billing-print-mode-${activeTabId}`}
              mode={receiptQrMode}
              totalPaisa={currentBillPaisa}
              upiDisabled={!printing || !upiIsReady}
              density="compact"
              onModeChange={handleReceiptQrModeChange}
            />
            {!printing || !upiIsReady ? (
              <p className="text-muted-foreground text-xs">
                {!printing
                  ? "Loading print settings…"
                  : "Add a UPI account in Settings → Printing."}
              </p>
            ) : null}
            {includeUpiQr && selectedUpiProfile ? (
              <div className="border-border min-w-0 rounded-(--radius-panel) border p-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span
                    id="billing-upi-profile-label"
                    className="text-foreground text-sm font-medium"
                  >
                    UPI account
                  </span>
                  {orderedUpiProfiles.length > 1 ? (
                    <span className="text-muted-foreground text-xs">
                      {orderedUpiProfiles.length} saved
                    </span>
                  ) : null}
                </div>
                <UpiAccountPicker
                  id="billing-upi-profile"
                  aria-labelledby="billing-upi-profile-label"
                  profiles={orderedUpiProfiles}
                  selectedProfileId={selectedUpiProfile.id}
                  defaultProfileId={printing?.defaultUpiQrProfileId}
                  onProfileChange={handleUpiProfileChange}
                  showListDetails={false}
                  variant="inline"
                />
              </div>
            ) : null}
          </div>
        </div>
      </fieldset>
    </section>
  );
}
