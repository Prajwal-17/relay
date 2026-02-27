import z from "zod";
import { TIME_PERIOD, TRANSACTION_TYPE } from "../../../shared/types";

export const timePeriodQuerySchema = z.object({
  timePeriod: z.enum([TIME_PERIOD.THIS_WEEK, TIME_PERIOD.THIS_YEAR, TIME_PERIOD.LAST_7_DAYS])
});

export const transactionTypeParamSchema = z.object({
  type: z.enum([TRANSACTION_TYPE.SALE, TRANSACTION_TYPE.ESTIMATE])
});
