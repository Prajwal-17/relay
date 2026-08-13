import type {
  PrintingConfig,
  RawLedgerStatementData,
  RawReceiptData,
  RawReceiptItem,
  StoreProfile
} from "@shared/types";
import { buildReceiptAddressLines, calculateThermalSavings } from "@shared/utils/thermalReceipt";

const PREVIEW_TRANSACTION_NO = 1048;
const PREVIEW_ITEMS: RawReceiptItem[] = [
  {
    name: "Premium Basmati Rice Extra Long Grain",
    quantity: "2.5",
    checkedQty: 2.5,
    unitPricePaisa: 8500,
    totalPaisa: 21250,
    mrpPaisa: 10000
  },
  {
    name: "Cold Pressed Groundnut Oil 1 Litre Bottle",
    quantity: "1",
    checkedQty: 0.5,
    unitPricePaisa: 19900,
    totalPaisa: 19900,
    mrpPaisa: 22000
  }
];

const DUMMY_STORE_PROFILE: StoreProfile = {
  id: "preview-store",
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

export function buildThermalPreviewReceipt(
  profile: StoreProfile | undefined,
  printing: PrintingConfig,
  transactionType: RawReceiptData["transactionType"],
  dateTime = new Date().toISOString()
): RawReceiptData {
  const sourceProfile = profile ?? DUMMY_STORE_PROFILE;
  const printUpiQr =
    transactionType === "sale" ? printing.printUpiQrOnSales : printing.printUpiQrOnEstimates;
  const upiIsReady = Boolean(printing.upiId.trim() && printing.upiPayeeName.trim());
  const totalPaisa = PREVIEW_ITEMS.reduce((sum, item) => sum + item.totalPaisa, 0);
  const savingsPaisa = calculateThermalSavings(PREVIEW_ITEMS);
  const profileAddressLines = buildReceiptAddressLines(sourceProfile);
  const fallbackAddressLines = buildReceiptAddressLines(DUMMY_STORE_PROFILE);

  return {
    storeName: sourceProfile.storeName.trim() || DUMMY_STORE_PROFILE.storeName,
    addressLines: printing.showAddress
      ? profileAddressLines.length > 0
        ? profileAddressLines
        : fallbackAddressLines
      : [],
    phone: printing.showPhone ? sourceProfile.phone.trim() || DUMMY_STORE_PROFILE.phone : undefined,
    gstin:
      transactionType === "sale" && printing.showGstinOnSales
        ? sourceProfile.gstin?.trim() || DUMMY_STORE_PROFILE.gstin || undefined
        : undefined,
    transactionType,
    transactionNo: PREVIEW_TRANSACTION_NO,
    customerName: printing.showCustomerName ? "Sample customer" : "",
    dateTime,
    items: PREVIEW_ITEMS,
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
      printUpiQr && upiIsReady
        ? {
            id: printing.upiId.trim(),
            payeeName: printing.upiPayeeName.trim(),
            includeAmount: printing.includeAmountInUpiQr
          }
        : undefined
  };
}

export function buildThermalPreviewLedger(
  profile: StoreProfile | undefined,
  printing: PrintingConfig,
  generatedAt = new Date().toISOString()
): RawLedgerStatementData {
  const sourceProfile = profile ?? DUMMY_STORE_PROFILE;
  const profileAddressLines = buildReceiptAddressLines(sourceProfile);
  const fallbackAddressLines = buildReceiptAddressLines(DUMMY_STORE_PROFILE);
  const entries: RawLedgerStatementData["entries"] = [
    {
      dateTime: "2026-08-01T10:30:00.000Z",
      particulars: "Sale",
      amountDuePaisa: 51250,
      amountPaidPaisa: 0,
      runningBalancePaisa: 51250
    },
    {
      dateTime: "2026-08-05T09:15:00.000Z",
      particulars: "Payment",
      amountDuePaisa: 0,
      amountPaidPaisa: 20000,
      runningBalancePaisa: 31250
    },
    {
      dateTime: "2026-08-09T16:45:00.000Z",
      particulars: "Sale",
      amountDuePaisa: 8500,
      amountPaidPaisa: 0,
      runningBalancePaisa: 39750
    }
  ];

  return {
    storeName: sourceProfile.storeName.trim() || DUMMY_STORE_PROFILE.storeName,
    addressLines: printing.showAddress
      ? profileAddressLines.length > 0
        ? profileAddressLines
        : fallbackAddressLines
      : [],
    phone: printing.showPhone ? sourceProfile.phone.trim() || DUMMY_STORE_PROFILE.phone : undefined,
    customerName: "Sample customer",
    generatedAt,
    entries,
    totalDuePaisa: entries.reduce((total, entry) => total + entry.amountDuePaisa, 0),
    totalPaidPaisa: entries.reduce((total, entry) => total + entry.amountPaidPaisa, 0),
    closingBalancePaisa: entries.at(-1)?.runningBalancePaisa ?? 0,
    extraFeedLines: printing.extraFeedLines,
    cutMode: printing.cutMode,
    footerMessage: printing.footerMessage.trim() || undefined
  };
}
