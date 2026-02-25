import { Hono } from "hono";
import { txnPayloadSchema } from "../../../shared/schemas/transaction.schema";
import { validateRequest } from "../../middleware/validation";
import { actionSchema, batchActionSchema, idSchema, itemIdSchema } from "../../zod";
import { filterSalesParamsSchema } from "./sales.schema";
import { salesService } from "./sales.service";

export const salesController = new Hono();

// get next Invoice No
salesController.get("/next-number", async (c) => {
  const result = await salesService.getNextInvoiceNo();
  return c.json(result, 200);
});

// get Sale (UnifiedTransctionWithItems) by Id
salesController.get("/:id", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  const result = await salesService.getSaleById(id);
  return c.json(result, 200);
});

// filter sales by date range
salesController.get("/", validateRequest("query", filterSalesParamsSchema), async (c) => {
  const rawParams = c.req.valid("query");
  const result = await salesService.filterSalesByDate(rawParams);
  return c.json(result, 200);
});

// create new Sale
salesController.post("/create", validateRequest("json", txnPayloadSchema), async (c) => {
  const payload = c.req.valid("json");
  const result = await salesService.createSale(payload.data);
  return c.json(result, 200);
});

// update an existing sale
salesController.post(
  "/:id/edit",
  validateRequest("param", idSchema),
  validateRequest("json", txnPayloadSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json");
    const result = await salesService.updateSale(id, payload.data);
    return c.json(result, 200);
  }
);

// convert Sale To Estimate
salesController.post("/:id/convert", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  const result = await salesService.convertSaleToEstimate(id);
  return c.json(result, 200);
});

// update checked-qty of a sale item - action "inc", "dec", "set"
salesController.post(
  "/:id/items/:itemId/checked-qty",
  validateRequest("param", itemIdSchema),
  validateRequest("json", actionSchema),
  async (c) => {
    const { itemId } = c.req.valid("param");
    const { action } = c.req.valid("json");
    await salesService.updateCheckedQtyService(itemId, action);
    return c.body(null, 204);
  }
);

// batch update checked-qty of a sale
salesController.post(
  "/:id/items/checked-qty/batch",
  validateRequest("param", idSchema),
  validateRequest("json", batchActionSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { action } = c.req.valid("json");
    await salesService.batchCheckItemsService(id, action);
    return c.body(null, 204);
  }
);

// delete Sale By Id
salesController.delete("/:id", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  await salesService.deleteSaleById(id);
  return c.body(null, 204);
});
