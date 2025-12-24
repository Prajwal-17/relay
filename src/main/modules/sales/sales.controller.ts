import { Hono } from "hono";
import { filterSalesParamsSchema, getSalesByCustomerSchema } from "./sales.schema";
import { salesService } from "./sales.service";

export const salesController = new Hono();

// get Sale (UnifiedTransctionWithItems) by Id
salesController.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ status: "error", error: { message: "Sale id is required" } }, 400);
    }

    const result = await salesService.getSaleById(id);
    const status = result.status === "success" ? 200 : 400;

    return c.json(result, status);
  } catch (error) {
    return c.json(
      {
        status: "error",
        error: { message: (error as Error).message ?? "Something went wrong while fetching sale" }
      },
      400
    );
  }
});

// filter sales by date range
salesController.get("/", async (c) => {
  try {
    const rawParams = {
      from: c.req.query("from"),
      to: c.req.query("to"),
      sortBy: c.req.query("sortBy"),
      pageNo: c.req.query("pageNo")
    };

    const parseResult = filterSalesParamsSchema.safeParse(rawParams);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await salesService.filterSalesByDate(parseResult.data);
    const status = result.status === "success" ? 200 : 400;

    return c.json(result, status);
  } catch (error) {
    return c.json(
      {
        status: "error",
        error: { message: (error as Error).message ?? "Something went wrong while fetching sale" }
      },
      400
    );
  }
});

// get Sales wrt to customer.id
salesController.get("/", async (c) => {
  try {
    const rawParams = {
      customerId: c.req.query("customerId"),
      pageNo: c.req.query("pageNo"),
      pageSize: c.req.query("pageSize")
    };

    const parseResult = getSalesByCustomerSchema.safeParse(rawParams);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await salesService.getSalesByCustomerId(parseResult.data);

    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

salesController.post("/convert/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ status: "error", error: { message: "Sale Id does not exist" } }, 400);
    }

    const result = await salesService.convertSaleToEstimate(id);
    const status = result.status === "success" ? 200 : 400;

    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

salesController.post("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ status: "error", error: { message: "Sale Id does not exist" } }, 400);
    }

    const result = await salesService.deleteSaleById(id);
    const status = result.status === "success" ? 200 : 400;

    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});
