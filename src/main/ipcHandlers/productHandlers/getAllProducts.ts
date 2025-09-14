import { ipcMain } from "electron/main";
import type { ApiResponse, ProductsType } from "../../../shared/types";
import { db } from "../../db/db";
import { products } from "../../db/schema";

export function getAllProducts() {
  ipcMain.handle("productsApi:getAllProducts", async (): Promise<ApiResponse<ProductsType[]>> => {
    try {
      const allProducts = await db.select().from(products);
      return { status: "success", data: allProducts };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Could not fetch Products" } };
    }
  });
}
