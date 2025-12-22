import { desc, eq } from "drizzle-orm";
import { db } from "../../db/db";
import { sales } from "../../db/schema";
import type { SalesByCustomerParams } from "./sales.types";

const getSalesByCustomerId = async (params: SalesByCustomerParams) => {
  const offset = (params.pageNo - 1) * params.pageSize;

  return await db.query.sales.findMany({
    where: eq(sales.customerId, params.customerId),
    orderBy: desc(sales.createdAt),
    limit: 20,
    offset: offset
  });
};

export const salesRepository = {
  getSalesByCustomerId
};
