import { Hono } from "hono";
import {
  createCustomerSchema,
  dirtyFieldsCustomerSchema
} from "../../../shared/schemas/customers.schema";
import { getEstimatesByCustomerSchema, getSalesByCustomerSchema } from "./customers.schema";
import { customersService } from "./customers.service";

export const customersController = new Hono();

// get all customers or search
customersController.get("/", async (c) => {
  try {
    const searchTerm = c.req.query("query");

    const result = await customersService.getCustomers(searchTerm ?? "");

    const status = result.status === "success" ? 201 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

// get DEFAULT customer
customersController.get("/default", async (c) => {
  try {
    const result = await customersService.getDefaultCustomer();

    const status = result.status === "success" ? 201 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

// get customer by id
customersController.get("/:id", async (c) => {
  try {
    const customerId = c.req.param("id");

    if (!customerId) {
      return c.json({ status: "error", error: { message: "Customer Id is missing" } }, 400);
    }

    const result = await customersService.findById(customerId);

    const status = result.status === "success" ? 201 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

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
    return c.json(
      { status: "error", error: { message: (error as Error).message ?? "Something went wrong" } },
      400
    );
  }
});

// get Sales wrt to customer.id
customersController.get("/:id/sales", async (c) => {
  try {
    const rawParams = {
      customerId: c.req.param("id"),
      pageNo: c.req.query("pageNo"),
      pageSize: c.req.query("pageSize")
    };

    const parseResult = getSalesByCustomerSchema.safeParse(rawParams);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await customersService.getSalesByCustomerId(parseResult.data);

    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

// get Estimates wrt to customer.id
customersController.get("/:id/estimates", async (c) => {
  try {
    const rawParams = {
      customerId: c.req.param("id"),
      pageNo: c.req.query("pageNo"),
      pageSize: c.req.query("pageSize")
    };

    const parseResult = getEstimatesByCustomerSchema.safeParse(rawParams);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await customersService.getEstimatesByCustomerId(parseResult.data);

    const status = result.status === "success" ? 200 : 400;
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
