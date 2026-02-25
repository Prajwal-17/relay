import { Hono } from "hono";
import {
  createProductSchema,
  dirtyFieldsProductSchema
} from "../../../shared/schemas/products.schema";
import { validateRequest } from "../../middleware/validation";
import { idSchema } from "../../zod";
import { productSearchSchema } from "./products.schema";
import { productService } from "./products.service";

export const productsController = new Hono();

// search product
productsController.get("/search", validateRequest("query", productSearchSchema), async (c) => {
  const rawParams = c.req.valid("query");
  const { query, pageNo, pageSize, filterType } = rawParams;
  const result = await productService.searchProduct({
    query,
    pageNo,
    pageSize,
    filterType
  });
  return c.json(result, 200);
});

// add product
productsController.post("/", validateRequest("json", createProductSchema), async (c) => {
  const payload = c.req.valid("json");
  const result = await productService.addProduct(payload);
  return c.json(result, 201);
});

// update Product
productsController.post(
  "/:id",
  validateRequest("param", idSchema),
  validateRequest("json", dirtyFieldsProductSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const payload = c.req.valid("json");
    const result = await productService.updateProduct(id, payload);
    return c.json(result, 200);
  }
);

// delete product
productsController.delete("/:id", validateRequest("param", idSchema), async (c) => {
  const { id } = c.req.valid("param");
  await productService.deleteProduct(id);
  return c.body(null, 204);
});
