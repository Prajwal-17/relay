import z, { uuidv4 } from "zod";
import { BATCH_CHECK_ACTION, UPDATE_QTY_ACTION } from "../../shared/types";

export const idSchema = z.object({
  id: uuidv4({ error: "Id param is invalid" })
});

export const itemIdSchema = z.object({
  itemId: uuidv4({ error: "Id param is invalid" })
});

export const actionSchema = z.object({
  action: z.enum(UPDATE_QTY_ACTION)
});

export const batchActionSchema = z.object({
  action: z.enum(BATCH_CHECK_ACTION)
});
