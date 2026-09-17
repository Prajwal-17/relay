import type { createMoneyOrm } from "@/lib/db/orm";

export type MoneyDatabase = ReturnType<typeof createMoneyOrm>;
