import type z from "zod";
import type { filterEstimatesParamsSchema } from "./estimates.schema";

export type FilterEstimatesParams = z.infer<typeof filterEstimatesParamsSchema>;
