import { Hono } from "hono";
import { PRODUCT_FILTER, type ProductPayload } from "../../../shared/types";
import { productService } from "./products.service";

export const productsController = new Hono();

productsController.get("/search", async (c) => {
  try {
    const query = c.req.query("query") ?? " ";
    const pageNoRaw = c.req.query("pageNo") ?? "1";
    const pageSizeRaw = c.req.query("pageSize") ?? "20";
    const filterType = c.req.query("filterType") ?? PRODUCT_FILTER.ACTIVE;

    const pageNo = Number(pageNoRaw);
    const pageSize = Number(pageSizeRaw);
    console.log(query, pageNoRaw, pageSizeRaw, filterType);

    // zod validate , all params
    // if (!query || !pageNo || !pageSize || !filterType) {
    //   return c.json({ status: "error", error: { message: "Invalid product payload" } }, 400);
    // }

    if (pageNo === null || pageNo === undefined) {
      return c.json(
        {
          status: "success",
          nextPageNo: null,
          data: []
        },
        200
      );
    }

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

productsController.post("/", async (c) => {
  try {
    const payload = (await c.req.json()) as ProductPayload;
    const result = await productService.addProduct(payload);

    const status = result.status === "success" ? 201 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Invalid product payload" } }, 400);
  }
});

productsController.post("/:id", async (c) => {
  try {
    const productId = c.req.param("id") as string;
    const payload = (await c.req.json()) as ProductPayload;
    if (!productId) {
      return c.json({ status: "error", error: { message: "Product id is required" } }, 400);
    }

    // zod validation
    // if (Object.keys(products).length === 0) {
    //        return {
    //          status: "error",
    //          error: {
    //            message: "The 'products' object cannot be empty. Please provide at least one product."
    //          }
    //        };
    //      }

    const result = await productService.updateProduct(productId, payload);

    const status = result.status === "success" ? 201 : 400;
    return c.json(result, status);
  } catch (error) {
    console.log(error);
    return c.json({ status: "error", error: { message: "Invalid product payload" } }, 400);
  }
});

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
