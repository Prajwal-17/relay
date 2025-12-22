import { Hono } from "hono";
import { getEstimatesByCustomerSchema } from "./estimates.schema";
import { estimatesService } from "./estimates.service";

export const estimatesController = new Hono();

// get Estimates wrt to customer.id
estimatesController.get("/", async (c) => {
  try {
    const rawParams = {
      customerId: c.req.query("customerId"),
      pageNo: c.req.query("pageNo"),
      pageSize: c.req.query("pageSize")
    };

    const parseResult = getEstimatesByCustomerSchema.safeParse(rawParams);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await estimatesService.getEstimatesByCustomerId(parseResult.data);

    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});
