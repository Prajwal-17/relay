import { ipcMain } from "electron/main";
import type { ApiResponse, Customer } from "../../../shared/types";
import { db } from "../../db/db";
import { customers } from "../../db/schema";

export function getAllCustomers() {
  // get all customers
  ipcMain.handle("customersApi:getAllCustomers", async (): Promise<ApiResponse<Customer[]>> => {
    try {
      const allCustomers = await db.select().from(customers).orderBy(customers.name);

      return { status: "success", data: allCustomers };
    } catch (error) {
      console.log(error);
      return {
        status: "error",
        error: { message: "Something went wrong" }
      };
    }
  });
}
