import { Hono } from "hono";
import { addProductSchema, productSearchSchema, updateProductSchema } from "./products.schema";
import { productService } from "./products.service";

export const productsController = new Hono();

// search product
productsController.get("/search", async (c) => {
  try {
    const rawParams = {
      query: c.req.query("query"),
      pageNo: c.req.query("pageNo"),
      pageSize: c.req.query("pageSize"),
      filterType: c.req.query("filterType")
    };

    const parseResult = productSearchSchema.safeParse(rawParams);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const { query, pageNo, pageSize, filterType } = parseResult.data;

    const result = await productService.searchProduct({
      query,
      pageNo,
      pageSize,
      filterType
    });

    const status = result.status === "success" ? 201 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Invalid product payload" } }, 400);
  }
});

// add product
productsController.post("/", async (c) => {
  try {
    const payload = await c.req.json();

    const parseResult = addProductSchema.safeParse(payload);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await productService.addProduct(parseResult.data);

    const status = result.status === "success" ? 201 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Invalid product payload" } }, 400);
  }
});

// update Product
productsController.post("/:id", async (c) => {
  try {
    const productId = c.req.param("id") as string;
    const payload = await c.req.json();

    const parseResult = updateProductSchema.safeParse(payload);

    if (!productId) {
      return c.json({ status: "error", error: { message: "Product id is required" } }, 400);
    }

    if (!parseResult.success) {
      const errorMessage = parseResult.error.issues[0].message;
      return c.json({ status: "error", error: { message: errorMessage } }, 400);
    }

    const result = await productService.updateProduct(productId, payload);

    const status = result.status === "success" ? 201 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Invalid product payload" } }, 400);
  }
});

// delete product
productsController.delete("/:id", async (c) => {
  try {
    const productId = c.req.param("id");
    if (!productId) {
      return c.json({ status: "error", error: { message: "Product id is required" } }, 400);
    }

    const result = await productService.deleteProduct(productId);

    const status = result.status === "success" ? 201 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Invalid product payload" } }, 400);
  }
});
