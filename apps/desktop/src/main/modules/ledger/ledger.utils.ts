import type { FifoAllocation, OpenSale } from "./ledger.types";

export function allocatePaymentFifo(
  paymentAmount: number,
  openSales: OpenSale[]
): { allocations: FifoAllocation[]; leftoverPaisa: number } {
  let pool = paymentAmount;
  const allocations: FifoAllocation[] = [];

  for (const sale of openSales) {
    if (pool <= 0) break;
    const remaining = (sale.grandTotal ?? 0) - (sale.amountPaid ?? 0);
    if (remaining <= 0) continue;
    const give = Math.min(pool, remaining);
    allocations.push({ saleId: sale.id, allocatedPaisa: give });
    pool -= give;
  }

  return { allocations, leftoverPaisa: pool };
}
