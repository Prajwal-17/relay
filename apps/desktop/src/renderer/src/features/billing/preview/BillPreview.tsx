import { buildRawReceiptPreviewData } from "@/features/billing/hooks/useRawReceiptPrint";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { useAppPreferences } from "@/features/preferences/useAppPreferences";
import { RasterReceiptPaper, ScaledThermalPaper } from "@/features/settings/RasterThermalPaper";
import { DeviceTextReceiptPaper } from "@/features/settings/ThermalReceiptPreview";
import { apiClient } from "@/lib/apiClient";
import type { PrintingConfig, StoreProfile } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
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
  upiId: "",
  upiPayeeName: "",
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
  const receipt = useMemo(
    () =>
      session ? buildRawReceiptPreviewData(session, profile ?? FALLBACK_PROFILE, printing) : null,
    [printing, profile, session]
  );

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
      </div>
    </div>
  );
}
