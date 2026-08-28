import { Button } from "@/components/ui/button";
import { buildBillingAccountSettlement } from "@/features/billing/billingAccountSettlement";
import { buildRawReceiptPreviewData } from "@/features/billing/hooks/useRawReceiptPrint";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { useAppPreferences } from "@/features/preferences/useAppPreferences";
import { RasterReceiptPaper, ScaledThermalPaper } from "@/features/settings/RasterThermalPaper";
import { DeviceTextReceiptPaper } from "@/features/settings/ThermalReceiptPreview";
import { apiClient } from "@/lib/apiClient";
import type { LedgerSummary, PrintingConfig, StoreProfile } from "@shared/types";
import { TRANSACTION_TYPE } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useMemo } from "react";

const FALLBACK_PRINTING: PrintingConfig = {
  printerName: "",
  defaultPrintMode: "raster",
  extraFeedLines: 4,
  cutMode: "partial",
  showAddress: true,
  showPhone: true,
  showGstinOnSales: true,
  showCustomerName: true,
  showSavings: true,
  savingsThresholdPaisa: 0,
  showLedgerPaymentMode: true,
  showLedgerNotes: true,
  footerMessage: "Thank you. Visit again.",
  upiQrProfiles: [],
  defaultUpiQrProfileId: null,
  printUpiQrOnSales: false,
  printUpiQrOnEstimates: false,
  includeAmountInUpiQr: true
};

const FALLBACK_PROFILE: StoreProfile = {
  id: "billing-preview",
  storeName: "Your Store Name",
  ownerName: "Store owner",
  phone: "9876543210",
  email: "store@example.com",
  addressLine1: "12 Market Road",
  addressLine2: null,
  country: "India",
  state: "Karnataka",
  pincode: "560001",
  city: "Bengaluru",
  gstin: "29ABCDE1234F1Z5",
  createdAt: "",
  updatedAt: ""
};

type BalancePreviewState = "loading" | "refreshing" | "error" | null;

function BalancePreviewStatus({
  state,
  error,
  onRetry
}: {
  state: BalancePreviewState;
  error: Error | null;
  onRetry: () => void;
}) {
  if (!state) return null;
  const isError = state === "error";
  const message = isError
    ? (error?.message ?? "Customer balance could not be loaded.")
    : state === "loading"
      ? "Loading customer balance…"
      : "Updating customer balance…";
  const Icon = isError ? AlertTriangle : state === "loading" ? Loader2 : RefreshCw;

  return (
    <div
      className="border-frame bg-card text-foreground mt-2 flex min-h-10 items-center gap-2 border px-2 text-xs"
      role={isError ? "alert" : "status"}
      aria-live="polite"
    >
      <Icon
        className={isError ? "text-destructive size-4" : "text-marker size-4 animate-spin"}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 font-medium">{message}</span>
      {isError ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0"
          onClick={onRetry}
        >
          <RefreshCw />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function BillPreview() {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const { config, defaults } = useAppPreferences();
  const { data: profile } = useQuery({
    queryKey: ["storeProfile"],
    queryFn: () => apiClient.get<StoreProfile>("/api/store-profile"),
    staleTime: Infinity
  });
  const printing = config?.printing ?? defaults?.printing ?? FALLBACK_PRINTING;
  const defaultCustomerId =
    config?.billing.defaultCustomerId ?? defaults?.billing.defaultCustomerId ?? null;
  const balanceCustomerId =
    session?.printOptions.includeAccountSummary &&
    session.billingType === TRANSACTION_TYPE.SALE &&
    session.addToAccounting &&
    session.customerId &&
    session.customerName.trim() &&
    session.customerId !== defaultCustomerId &&
    session.customerName.trim().toUpperCase() !== "DEFAULT"
      ? session.customerId
      : null;
  const {
    data: balanceSummary,
    error: balanceError,
    isPending: isBalancePending,
    isFetching: isBalanceFetching,
    refetch: refetchBalance
  } = useQuery({
    queryKey: ["customer-ledger-summary", balanceCustomerId ?? ""],
    queryFn: () => {
      if (!balanceCustomerId) throw new Error("Choose an account customer first.");
      return apiClient.get<LedgerSummary>(
        "/api/customers/" + encodeURIComponent(balanceCustomerId) + "/ledger-summary"
      );
    },
    enabled: Boolean(balanceCustomerId)
  });

  const accountSettlement = useMemo(() => {
    if (!session?.printOptions.includeAccountSummary) return undefined;
    if (!balanceSummary) return undefined;
    return buildBillingAccountSettlement(session, balanceSummary);
  }, [balanceSummary, session]);

  const receipt = useMemo(
    () =>
      session
        ? buildRawReceiptPreviewData(session, profile ?? FALLBACK_PROFILE, printing, {
            includeUpiQr: session.printOptions.includeUpiQr,
            includeAmountInUpiQr: session.printOptions.includeAmountInUpiQr,
            upiQrProfileId: session.printOptions.selectedUpiQrProfileId,
            accountSettlement
          })
        : null,
    [accountSettlement, printing, profile, session]
  );

  const normalizedBalanceError = balanceError instanceof Error ? balanceError : null;
  const balanceState: BalancePreviewState = !balanceCustomerId
    ? null
    : normalizedBalanceError
      ? "error"
      : !accountSettlement && isBalancePending
        ? "loading"
        : isBalanceFetching
          ? "refreshing"
          : null;

  if (!receipt) return null;

  return (
    <div className="flex min-h-full justify-center p-3 pb-16">
      <div className="w-full max-w-[420px]">
        {printing.defaultPrintMode === "raster" ? (
          <ScaledThermalPaper extraFeedLines={receipt.extraFeedLines} cutMode={receipt.cutMode}>
            <RasterReceiptPaper receipt={receipt} />
          </ScaledThermalPaper>
        ) : (
          <DeviceTextReceiptPaper receipt={receipt} />
        )}
        <BalancePreviewStatus
          state={balanceState}
          error={normalizedBalanceError}
          onRetry={() => void refetchBalance()}
        />
      </div>
    </div>
  );
}
