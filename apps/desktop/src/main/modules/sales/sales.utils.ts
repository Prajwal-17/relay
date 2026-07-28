import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../../db/schema";
import { appPreferences, customers } from "../../db/schema";
import { AppError } from "../../utils/appError";

type Tx = BetterSQLite3Database<typeof schema>;

const SALE_LOCK_MS = 48 * 60 * 60 * 1000;

export const assertSaleCanModify = (recordedAt: string) => {
  if (Date.now() - new Date(recordedAt).getTime() > SALE_LOCK_MS) {
    throw new AppError("This sale is permanently locked after 48 hours", 409);
  }
};

export const assertAccountingCustomer = (tx: Tx, customerId: string) => {
  const customer = tx.select().from(customers).where(eq(customers.id, customerId)).get();
  if (!customer) throw new AppError("A named customer is required for accounting", 400);

  const isConfiguredDefault = tx
    .select({ config: appPreferences.config })
    .from(appPreferences)
    .all()
    .some(
      (row: { config: { billing: { defaultCustomerId: string } } }) =>
        row.config.billing.defaultCustomerId === customerId
    );

  if (customer.name === "DEFAULT" || isConfiguredDefault) {
    throw new AppError("The default customer cannot be added to Accounting", 400);
  }
};
