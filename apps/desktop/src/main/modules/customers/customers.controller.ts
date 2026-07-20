import { Hono } from "hono";
import {
  createCustomerSchema,
  dirtyFieldsCustomerSchema
} from "../../../shared/schemas/customers.schema";
import { validateRequest } from "../../middleware/validation";
import { idSchema } from "../../zod";
import {
  createAdjustmentSchema,
  createOpeningBalanceSchema,
  createPaymentSchema,
  createQuickSaleSchema,
  getLedgerSchema,
  updateLedgerEntrySchema
} from "../ledger/ledger.schema";
import { ledgerService } from "../ledger/ledger.service";
import {
  getEstimatesByCustomerSchema,
  getSalesByCustomerSchema,
  listCustomersSchema
} from "./customers.schema";
import { customersService } from "./customers.service";

export const customersController = new Hono();

customersController.get("/", validateRequest("query", listCustomersSchema), async (c) => {
  const { pageNo, pageSize, query, type, sort } = c.req.valid("query");
  const result = await customersService.getCustomersPaginated({
    pageNo,
    pageSize,
    query,
    type,
    sort
  });
  return c.json(result, 200);
});

// get DEFAULT customer
customersController.get("/default", async (c) => {
  const result = await customersService.getDefaultCustomer();
  return c.json(result, 200);
});

// get customer by id
customersController.get("/:id", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  const result = await customersService.findById(id);
  return c.json(result, 200);
});

customersController.get("/:id/summary", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  const result = await customersService.getCustomerSummary(id);
  return c.json(result, 200);
});

// createCustomer
customersController.post("/", validateRequest("json", createCustomerSchema), async (c) => {
  const payload = c.req.valid("json");
  const result = await customersService.createCustomer(payload);
  return c.json(result, 201);
});

// get Sales wrt to customer.id
customersController.get(
  "/:id/sales",
  validateRequest("param", idSchema),
  validateRequest("query", getSalesByCustomerSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const query = c.req.valid("query");

    const result = await customersService.getSalesByCustomerId({
      customerId: id,
      ...query
    });

    return c.json(result, 200);
  }
);

// get Estimates wrt to customer.id
customersController.get(
  "/:id/estimates",
  validateRequest("param", idSchema),
  validateRequest("query", getEstimatesByCustomerSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const query = c.req.valid("query");

    const result = await customersService.getEstimatesByCustomerId({
      customerId: id,
      ...query
    });

    return c.json(result, 200);
  }
);

// update Customer
customersController.post(
  "/:id",
  validateRequest("param", idSchema),
  validateRequest("json", dirtyFieldsCustomerSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json");

    const result = await customersService.updateCustomerById(id, payload);

    return c.json(result, 200);
  }
);

// ledger (accounting)
customersController.get(
  "/:id/ledger",
  validateRequest("param", idSchema),
  validateRequest("query", getLedgerSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const query = c.req.valid("query");
    const result = await ledgerService.getLedgerByCustomerId({ customerId: id, ...query });
    return c.json(result, 200);
  }
);

customersController.get("/:id/ledger-summary", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  const result = await ledgerService.getLedgerSummary(id);
  return c.json(result, 200);
});

customersController.post(
  "/:id/payments",
  validateRequest("param", idSchema),
  validateRequest("json", createPaymentSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json");
    const result = await ledgerService.createPayment({ customerId: id, payload });
    return c.json(result, 201);
  }
);

customersController.post(
  "/:id/adjustments",
  validateRequest("param", idSchema),
  validateRequest("json", createAdjustmentSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json");
    const result = await ledgerService.createAdjustment({ customerId: id, payload });
    return c.json(result, 201);
  }
);

customersController.post(
  "/:id/quick-sales",
  validateRequest("param", idSchema),
  validateRequest("json", createQuickSaleSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json");
    const result = await ledgerService.createQuickSale({ customerId: id, payload });
    return c.json(result, 201);
  }
);

customersController.post(
  "/:id/opening-balance",
  validateRequest("param", idSchema),
  validateRequest("json", createOpeningBalanceSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json");
    const result = await ledgerService.createOpeningBalance({ customerId: id, payload });
    return c.json(result, 201);
  }
);

customersController.patch(
  "/:id/ledger/:entryId",
  validateRequest("param", idSchema),
  validateRequest("json", updateLedgerEntrySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { entryId } = c.req.param();
    const payload = c.req.valid("json");
    const result = await ledgerService.updateLedgerEntry({ entryId, customerId: id, payload });
    return c.json(result, 200);
  }
);

customersController.delete(
  "/:id/ledger/:entryId",
  validateRequest("param", idSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { entryId } = c.req.param();
    await ledgerService.deleteLedgerEntry({ entryId, customerId: id });
    return c.body(null, 204);
  }
);

// delete customer
customersController.delete("/:id", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  await customersService.deleteCustomerById(id);
  return c.body(null, 204);
});
