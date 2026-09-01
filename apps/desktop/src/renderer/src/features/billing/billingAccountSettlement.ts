import type { BillingSessionData } from "@/features/billing/store/billingSession.types";
import { apiClient } from "@/lib/apiClient";
import type { LedgerSummary, RawReceiptAccountSettlement } from "@shared/types";
import { roundPaisaToNearestRupee } from "@shared/utils/utils";

export function getBillingCurrentBillPaisa(session: BillingSessionData): number {
  return roundPaisaToNearestRupee(
    session.lineItems.reduce(
      (total, item) => total + (!item.isDeleted && item.totalPrice > 0 ? item.totalPrice : 0),
      0
    )
  );
}

export function buildBillingAccountSettlement(
  session: BillingSessionData,
  summary: LedgerSummary
): RawReceiptAccountSettlement {
  const currentBillPaisa = getBillingCurrentBillPaisa(session);
  const lastPayment = summary.lastPayment;
  const lastPaymentAt = lastPayment ? new Date(lastPayment.date).getTime() : Number.NaN;
  const accountSummaryStartedAt = session.printOptions.accountSummaryStartedAt;
  const paymentPaisa =
    Number.isFinite(lastPaymentAt) &&
    Number.isFinite(accountSummaryStartedAt) &&
    lastPaymentAt >= accountSummaryStartedAt
      ? (lastPayment?.amount ?? 0)
      : 0;
  const currentSaleIsInBalance = session.addToAccounting && Boolean(session.billingId);
  const previousBalancePaisa =
    summary.currentBalance - (currentSaleIsInBalance ? currentBillPaisa : 0) + paymentPaisa;
  const totalDuePaisa = previousBalancePaisa + currentBillPaisa;

  return {
    previousBalancePaisa,
    currentBillPaisa,
    totalDuePaisa,
    paymentPaisa,
    balancePaisa: totalDuePaisa - paymentPaisa
  };
}

export function fetchBillingLedgerSummary(customerId: string) {
  return apiClient.get<LedgerSummary>(
    "/api/customers/" + encodeURIComponent(customerId) + "/ledger-summary"
  );
}
