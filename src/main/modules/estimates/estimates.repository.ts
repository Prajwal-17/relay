import { desc, eq } from "drizzle-orm";
import { db } from "../../db/db";
import { estimates } from "../../db/schema";
import type { EstimatesByCustomerParams } from "./estimates.types";

const getEstimatesByCustomerId = async (params: EstimatesByCustomerParams) => {
  const offset = (params.pageNo - 1) * params.pageSize;

  return await db.query.estimates.findMany({
    where: eq(estimates.customerId, params.customerId),
    orderBy: desc(estimates.createdAt),
    limit: 20,
    offset: offset
  });
};

export const estimatesRepository = {
  getEstimatesByCustomerId
};
