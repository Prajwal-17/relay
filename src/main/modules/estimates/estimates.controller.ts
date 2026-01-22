import { Hono } from "hono";
import { txnPayloadSchema } from "../../../shared/schemas/transaction.schema";
import { filterEstimatesParamsSchema } from "./estimates.schema";
import { estimatesService } from "./estimates.service";

export const estimatesController = new Hono();

// get next Invoice No
estimatesController.get("/next-number", async (c) => {
  try {
    const result = await estimatesService.getNextEstimateNo();

    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

// get Estimate (UnifiedTransctionWithItems) by Id
estimatesController.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ status: "error", error: { message: "Estimate id is required" } }, 400);
    }

    const result = await estimatesService.getEstimateById(id);
    const status = result.status === "success" ? 200 : 400;

    return c.json(result, status);
  } catch (error) {
    return c.json(
      {
        status: "error",
        error: {
          message: (error as Error).message ?? "Something went wrong while fetching estimate"
        }
      },
      400
    );
  }
});

// filter estimates by date range
estimatesController.get("/", async (c) => {
  try {
    const rawParams = {
      from: c.req.query("from"),
      to: c.req.query("to"),
      sortBy: c.req.query("sortBy"),
      pageNo: c.req.query("pageNo")
    };

    const parseResult = filterEstimatesParamsSchema.safeParse(rawParams);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await estimatesService.filterEstimateByDate(parseResult.data);
    const status = result.status === "success" ? 200 : 400;

    return c.json(result, status);
  } catch (error) {
    return c.json(
      {
        status: "error",
        error: {
          message: (error as Error).message ?? "Something went wrong while fetching estimate"
        }
      },
      400
    );
  }
});

// create new estimate
estimatesController.post("/create", async (c) => {
  try {
    const payload = await c.req.json();

    const parseResult = txnPayloadSchema.safeParse(payload);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await estimatesService.createEstimate(payload.data);

    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

// update an existing estimate
estimatesController.post("/:id/edit", async (c) => {
  try {
    const id = c.req.param("id");
    const payload = await c.req.json();

    const parseResult = txnPayloadSchema.safeParse(payload);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await estimatesService.updateEstimate(id, payload.data);

    const status = result.status === "success" ? 200 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

// convert Sale To Estimate
estimatesController.post("/:id/convert", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ status: "error", error: { message: "Estimate Id does not exist" } }, 400);
    }

    const result = await estimatesService.convertEstimateToSale(id);
    const status = result.status === "success" ? 200 : 400;

    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});

// delete Estimate By Id
estimatesController.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    if (!id) {
      return c.json({ status: "error", error: { message: "Estimate Id does not exist" } }, 400);
    }

    const result = await estimatesService.deleteEstimateById(id);
    const status = result.status === "success" ? 200 : 400;

    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Something went wrong" } }, 400);
  }
});
