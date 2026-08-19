import { apiClient } from "@/lib/apiClient";
import { prepareRasterReceipt } from "@/features/settings/thermalRaster";
import { normalizeLineItems } from "@/features/billing/store/billingSession.helpers";
import { filterValidLineItems } from "@/utils/renderer.utils";
import type { BillingSessionData } from "@/features/billing/store/billingSession.types";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import type {
  AppPreferencesResponse,
  PrintingConfig,
  RasterReceiptSegments,
  RawReceiptAccountSettlement,
  RawReceiptData,
  StoreProfile,
  TransactionType,
  UnifiedTransctionWithItems
} from "@shared/types";
import { BILLSTATUS } from "@shared/types";
import { buildReceiptAddressLines, calculateThermalSavings } from "@shared/utils/thermalReceipt";
import { resolveUpiQrProfile } from "@shared/utils/upiQrProfiles";
import { rupeesToPaisa } from "@shared/utils/utils";
import { useCallback } from "react";

type ReceiptBuildMode = "print" | "preview";

export type ReceiptPrintOverrides = {
  includeUpiQr?: boolean | null;
  includeAmountInUpiQr?: boolean | null;
  upiQrProfileId?: string | null;
  accountSettlement?: RawReceiptAccountSettlement;
};

type PrepareReceiptOptions = {
  omitFooter?: boolean;
  overrides?: ReceiptPrintOverrides;
};

function createRawReceiptData(
  session: BillingSessionData,
  profile: StoreProfile,
  printing: PrintingConfig,
  mode: ReceiptBuildMode,
  overrides: ReceiptPrintOverrides = {}
): RawReceiptData {
  const isPrintJob = mode === "print";
  if (isPrintJob && !session.transactionNo) {
    throw new Error("The bill has not received a transaction number yet.");
  }

  const validItems = filterValidLineItems(session.lineItems).filter((item) => !item.isDeleted);
  if (isPrintJob && validItems.length === 0) {
    throw new Error("Add at least one valid item before printing.");
  }

  const defaultPrintUpiQr =
    session.billingType === "sale" ? printing.printUpiQrOnSales : printing.printUpiQrOnEstimates;
  const printUpiQr = overrides.includeUpiQr ?? defaultPrintUpiQr;
  const upiProfile = resolveUpiQrProfile(printing, overrides.upiQrProfileId);
  if (isPrintJob && printUpiQr && !upiProfile) {
    throw new Error(
      overrides.upiQrProfileId
        ? "The selected UPI account is no longer available. Choose another account."
        : "Add a UPI account in Printing settings."
    );
  }

  const items = validItems.map((item) => ({
    name: item.productSnapshot,
    quantity: item.quantity,
    checkedQty: item.checkedQty ?? 0,
    unitPricePaisa: rupeesToPaisa(Number(item.price)),
    totalPaisa: item.totalPrice,
    mrpPaisa: item.mrp ?? undefined
  }));
  const totalPaisa = items.reduce((sum, item) => sum + item.totalPaisa, 0);
  const savingsPaisa = calculateThermalSavings(items);

  return {
    storeName: profile.storeName,
    addressLines: printing.showAddress ? buildReceiptAddressLines(profile) : [],
    phone: printing.showPhone && profile.phone.trim() ? profile.phone.trim() : undefined,
    gstin:
      session.billingType === "sale" && printing.showGstinOnSales && profile.gstin?.trim()
        ? profile.gstin.trim()
        : undefined,
    transactionType: session.billingType,
    transactionNo: session.transactionNo ?? 0,
    customerName: printing.showCustomerName ? session.customerName.trim() || "Walk-in" : "",
    dateTime: session.billingDate.toISOString(),
    items,
    subtotalPaisa: totalPaisa,
    totalPaisa,
    savingsPaisa:
      printing.showSavings && savingsPaisa > 0 && savingsPaisa >= printing.savingsThresholdPaisa
        ? savingsPaisa
        : undefined,
    extraFeedLines: printing.extraFeedLines,
    cutMode: printing.cutMode,
    footerMessage: printing.footerMessage.trim() || undefined,
    upi:
      printUpiQr && upiProfile
        ? {
            id: upiProfile.upiId,
            payeeName: upiProfile.payeeName,
            includeAmount: overrides.includeAmountInUpiQr ?? printing.includeAmountInUpiQr
          }
        : undefined,
    accountSettlement: overrides.accountSettlement
  };
}

export function buildRawReceiptData(
  session: BillingSessionData,
  profile: StoreProfile,
  printing: PrintingConfig,
  overrides: ReceiptPrintOverrides = {}
): RawReceiptData {
  return createRawReceiptData(session, profile, printing, "print", overrides);
}

export function buildRawReceiptPreviewData(
  session: BillingSessionData,
  profile: StoreProfile,
  printing: PrintingConfig,
  overrides: ReceiptPrintOverrides = {}
): RawReceiptData {
  return createRawReceiptData(session, profile, printing, "preview", overrides);
}

export function buildRawReceiptDataFromTransaction(
  transaction: UnifiedTransctionWithItems,
  profile: StoreProfile,
  printing: PrintingConfig
): RawReceiptData {
  const billingDate = new Date(transaction.createdAt ?? transaction.recordedAt ?? "");
  if (Number.isNaN(billingDate.getTime())) {
    throw new Error("The saved transaction date is unavailable.");
  }

  const session: BillingSessionData = {
    isMetaDataDirty: false,
    billingId: transaction.id,
    billingType: transaction.type,
    transactionNo: transaction.transactionNo,
    billingDate,
    customerId: transaction.customerId,
    customerName: transaction.customer.name,
    isNewCustomer: false,
    status: BILLSTATUS.SAVED,
    isCountColumnVisible: false,
    notes: transaction.notes,
    addToAccounting: Boolean(transaction.isAddedToAccounting),
    printOptions: {
      includeUpiQr: null,
      includeAmountInUpiQr: null,
      selectedUpiQrProfileId: null,
      includeAccountSummary: false,
      accountSummaryStartedAt: Date.now()
    },
    lineItems: normalizeLineItems(transaction.items)
  };

  return buildRawReceiptData(session, profile, printing);
}

const useRawReceiptPrint = () => {
  const prepareReceipt = useCallback(async (tabId: string, options: PrepareReceiptOptions = {}) => {
    const [profile, preferences] = await Promise.all([
      apiClient.get<StoreProfile>("/api/store-profile"),
      apiClient.get<AppPreferencesResponse>("/api/app-preferences")
    ]);

    const session = useBillingSessionStore.getState().sessions[tabId];
    if (!session) throw new Error("The synchronized billing session is no longer available.");

    const receipt = buildRawReceiptData(
      session,
      profile,
      preferences.config.printing,
      options.overrides
    );
    let raster: RasterReceiptSegments | undefined;
    if (preferences.config.printing.defaultPrintMode === "raster") {
      try {
        raster = await prepareRasterReceipt(receipt, { omitFooter: options.omitFooter });
      } catch (error) {
        console.warn("High-quality receipt preparation failed; device text will be used.", error);
      }
    }
    return { receipt, raster };
  }, []);

  const printReceipt = useCallback(
    async (tabId: string, overrides: ReceiptPrintOverrides = {}) => {
      const { receipt, raster } = await prepareReceipt(tabId, { overrides });
      const response = await window.rawPrintApi.printReceipt(receipt, raster);
      if (response.status === "error") throw new Error(response.error.message);
      return response.data;
    },
    [prepareReceipt]
  );

  const prepareSavedReceipt = useCallback(
    async ({ id, type }: { id: string; type: TransactionType }) => {
      const [transaction, profile, preferences] = await Promise.all([
        apiClient.get<UnifiedTransctionWithItems>(`/api/${type}s/${id}`),
        apiClient.get<StoreProfile>("/api/store-profile"),
        apiClient.get<AppPreferencesResponse>("/api/app-preferences")
      ]);

      const receipt = buildRawReceiptDataFromTransaction(
        transaction,
        profile,
        preferences.config.printing
      );
      let raster: RasterReceiptSegments | undefined;
      if (preferences.config.printing.defaultPrintMode === "raster") {
        try {
          raster = await prepareRasterReceipt(receipt);
        } catch (error) {
          console.warn("High-quality receipt preparation failed; device text will be used.", error);
        }
      }
      return { receipt, raster };
    },
    []
  );

  const printSavedReceipt = useCallback(
    async (transaction: { id: string; type: TransactionType }) => {
      const { receipt, raster } = await prepareSavedReceipt(transaction);
      const response = await window.rawPrintApi.printReceipt(receipt, raster);
      if (response.status === "error") throw new Error(response.error.message);
      return response.data;
    },
    [prepareSavedReceipt]
  );

  return { prepareReceipt, printReceipt, prepareSavedReceipt, printSavedReceipt };
};

export default useRawReceiptPrint;
