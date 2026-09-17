import { eq, max } from "drizzle-orm";
import { supplierPayments } from "@/lib/db/schema";
import type { MoneyDatabase } from "@/types/database.types";
import type { VendorPaymentInput } from "../money.types";

export async function insertVendorPayment(db: MoneyDatabase, input: VendorPaymentInput) {
  const [last] = await db
    .select({ position: max(supplierPayments.position) })
    .from(supplierPayments)
    .where(eq(supplierPayments.date, input.date));
  await db
    .insert(supplierPayments)
    .values({
      ...input,
      note: input.note?.trim() || null,
      position: (last?.position ?? -1) + 1
    })
    .run();
}
