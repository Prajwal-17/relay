import { Hono } from "hono";
import { estimateTxnPayloadSchema } from "../../../shared/schemas/transaction.schema";
import { validateRequest } from "../../middleware/validation";
import { actionSchema, batchActionSchema, idSchema, itemIdSchema } from "../../zod";
import { filterEstimatesParamsSchema } from "./estimates.schema";
import { estimatesService } from "./estimates.service";

export const estimatesController = new Hono();
const estimateItemIdSchema = idSchema.extend(itemIdSchema.shape);

// get next Estimate No
estimatesController.get("/next-number", async (c) => {
  const result = await estimatesService.getNextEstimateNo();
  return c.json(result, 200);
});

// get Estimate (UnifiedTransctionWithItems) by Id
estimatesController.get("/:id", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  const result = await estimatesService.getEstimateById(id);
  return c.json(result, 200);
});

// filter estimates by date range
estimatesController.get("/", validateRequest("query", filterEstimatesParamsSchema), async (c) => {
  const rawParams = c.req.valid("query");
  const result = await estimatesService.filterEstimateByDate(rawParams);
  return c.json(result, 200);
});

// create new Estimate
estimatesController.post(
  "/create",
  validateRequest("json", estimateTxnPayloadSchema),
  async (c) => {
    const payload = c.req.valid("json");
    const result = await estimatesService.createEstimate(payload.data);
    return c.json(result, 200);
  }
);

estimatesController.post(
  "/:id/sync",
  validateRequest("param", idSchema),
  validateRequest("json", estimateTxnPayloadSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json");
    const result = await estimatesService.syncEstimate(id, payload.data);
    return c.json(result, 200);
  }
);

// convert Estimate To Sale
estimatesController.post("/:id/convert", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  const result = await estimatesService.convertEstimateToSale(id);
  return c.json(result, 200);
});

// update checked-qty of an estimate item - action "inc", "dec", "set"
estimatesController.post(
  "/:id/items/:itemId/checked-qty",
  validateRequest("param", estimateItemIdSchema),
  validateRequest("json", actionSchema),
  async (c) => {
    const { id, itemId } = c.req.valid("param");
    const { action } = c.req.valid("json");
    await estimatesService.updateCheckedQtyService(id, itemId, action);
    return c.body(null, 204);
  }
);

// batch update checked-qty of an estimate
estimatesController.post(
  "/:id/items/checked-qty/batch",
  validateRequest("param", idSchema),
  validateRequest("json", batchActionSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { action } = c.req.valid("json");
    await estimatesService.batchCheckItemsService(id, action);
    return c.body(null, 204);
  }
);

// delete Estimate By Id
estimatesController.delete("/:id", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  await estimatesService.deleteEstimateById(id);
  return c.body(null, 204);
});

// duplicate Estimate By Id
estimatesController.post("/:id/duplicate", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  const result = await estimatesService.duplicateEstimateById(id);
  return c.json(result, 200);
});
