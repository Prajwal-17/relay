import type z from "zod";
import type { filterSalesParamsSchema } from "./sales.schema";

export type FilterSalesParams = z.infer<typeof filterSalesParamsSchema>;
