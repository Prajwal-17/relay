import {
  createInitialSession,
  normalizeLineItems
} from "@/features/billing/store/billingSession.helpers";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import type { BillingSessionData } from "@/features/billing/store/billingSession.types";
import { prepareRasterReceipt } from "@/features/settings/thermalRaster";
import { apiClient } from "@/lib/apiClient";
import { filterValidLineItems } from "@/utils/renderer.utils";
import type {
  AppPreferencesResponse,
  PrintingConfig,
  RasterReceiptSegments,
  RawReceiptData,
  StoreProfile,
  TransactionType,
  UnifiedTransctionWithItems
} from "@shared/types";
import { BILLSTATUS } from "@shared/types";
import { buildReceiptAddressLines, calculateThermalSavings } from "@shared/utils/thermalReceipt";
import { resolveUpiQrProfile } from "@shared/utils/upiQrProfiles";
import { roundPaisaToNearestRupee, rupeesToPaisa } from "@shared/utils/utils";
import { useCallback } from "react";

type ReceiptBuildMode = "print" | "preview";

export type ReceiptPrintOverrides = {
  includeUpiQr?: boolean | null;
  includeAmountInUpiQr?: boolean | null;
  upiQrProfileId?: string | null;
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
  const subtotalPaisa = items.reduce((sum, item) => sum + item.totalPaisa, 0);
  const totalPaisa = roundPaisaToNearestRupee(subtotalPaisa);
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
    subtotalPaisa,
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
        : undefined
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
  printing: PrintingConfig,
  overrides: ReceiptPrintOverrides = {}
): RawReceiptData {
  const billingDate = new Date(transaction.createdAt ?? transaction.recordedAt ?? "");
  if (Number.isNaN(billingDate.getTime())) {
    throw new Error("The saved transaction date is unavailable.");
  }

  const session: BillingSessionData = {
    ...createInitialSession(),
    metadataRevision: 0,
    persistedMetadataRevision: 0,
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
      selectedUpiQrProfileId: null
    },
    lineItems: normalizeLineItems(transaction.items)
  };

  return buildRawReceiptData(session, profile, printing, overrides);
}

type SavedReceiptPrintRequest = {
  id: string;
  type: TransactionType;
  overrides?: ReceiptPrintOverrides;
};

async function prepareRequiredReceiptRaster(
  receipt: RawReceiptData,
  printing: PrintingConfig,
  options: { omitFooter?: boolean } = {}
): Promise<RasterReceiptSegments | undefined> {
  if (printing.defaultPrintMode !== "raster" && !receipt.upi) return undefined;

  try {
    return await prepareRasterReceipt(receipt, options);
  } catch (error) {
    if (receipt.upi) {
      throw new Error("The payment QR could not be prepared safely. Nothing was printed.", {
        cause: error
      });
    }
    console.warn("High-quality receipt preparation failed; device text will be used.", error);
    return undefined;
  }
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
    const raster = await prepareRequiredReceiptRaster(receipt, preferences.config.printing, {
      omitFooter: options.omitFooter
    });
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
    async ({ id, type, overrides }: SavedReceiptPrintRequest) => {
      const [transaction, profile, preferences] = await Promise.all([
        apiClient.get<UnifiedTransctionWithItems>(`/api/${type}s/${id}`),
        apiClient.get<StoreProfile>("/api/store-profile"),
        apiClient.get<AppPreferencesResponse>("/api/app-preferences")
      ]);

      const receipt = buildRawReceiptDataFromTransaction(
        transaction,
        profile,
        preferences.config.printing,
        overrides
      );
      const raster = await prepareRequiredReceiptRaster(receipt, preferences.config.printing);
      return { receipt, raster };
    },
    []
  );

  const printSavedReceipt = useCallback(
    async (transaction: SavedReceiptPrintRequest) => {
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
