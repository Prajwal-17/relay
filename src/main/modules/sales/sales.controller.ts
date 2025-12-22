import { Hono } from "hono";
import { getSalesByCustomerSchema } from "./sales.schema";
import { salesService } from "./sales.service";

export const salesController = new Hono();

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
