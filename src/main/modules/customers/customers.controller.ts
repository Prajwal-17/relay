import { Hono } from "hono";
import {
  createCustomerSchema,
  dirtyFieldsCustomerSchema
} from "../../../shared/schemas/customers.schema";
import { validateRequest } from "../../middleware/validation";
import { idSchema } from "../../zod";
import { getEstimatesByCustomerSchema, getSalesByCustomerSchema } from "./customers.schema";
import { customersService } from "./customers.service";

export const customersController = new Hono();

// get all customers or search
customersController.get("/", async (c) => {
  const searchTerm = c.req.query("query");
  const result = await customersService.getCustomers(searchTerm ?? "");
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

// delete customer
customersController.delete("/:id", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  await customersService.deleteCustomerById(id);
  return c.status(204);
});
