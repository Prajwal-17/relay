import { Hono } from "hono";
import {
  createCustomerSchema,
  dirtyFieldsCustomerSchema
} from "../../../shared/schemas/customers.schema";
import { customersService } from "./customers.service";

export const customersController = new Hono();

// createCustomer
customersController.post("/", async (c) => {
  try {
    const body = await c.req.json();

    const parseResult = createCustomerSchema.safeParse(body);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await customersService.createCustomer(parseResult.data);

    const status = result.status === "success" ? 201 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

// update Customer
customersController.post("/:id", async (c) => {
  try {
    const customerId = c.req.param("id");
    const payload = await c.req.json();

    if (!customerId) {
      return c.json({ status: "error", error: { message: "Customer Id is missing" } }, 400);
    }

    const parseResult = dirtyFieldsCustomerSchema.safeParse(payload);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await customersService.updateCustomerById(customerId, parseResult.data);

    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

// delete customer
customersController.delete("/:id", async (c) => {
  try {
    const customerId = c.req.param("id");

    if (!customerId) {
      return c.json({ status: "error", error: { message: "Customer Id is missing" } }, 400);
    }

    const result = await customersService.deleteCustomerById(customerId);
    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});
