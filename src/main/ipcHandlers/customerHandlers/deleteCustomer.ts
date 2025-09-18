import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { customers, estimates, sales } from "../../db/schema";

export function deleteCustomer() {
  // delete existing customer
  ipcMain.handle(
    "customersApi:deleteCustomer",
    async (_event, customerId: string): Promise<ApiResponse<string>> => {
      try {
        const existingSales = await db.select().from(sales).where(eq(sales.customerId, customerId));

        const existingEstimates = await db
          .select()
          .from(estimates)
          .where(eq(estimates.customerId, customerId));

        if (existingSales.length > 0 || existingEstimates.length > 0) {
          return {
            status: "error",
            error: {
              message: "Cannot delete customer with existing sales transactions."
            }
          };
        }

        const customer = await db.delete(customers).where(eq(customers.id, customerId));

        if (customer.changes > 0) {
          return { status: "success", data: "Successfully deleted customer" };
        } else {
          return {
            status: "error",
            error: { message: "Customer not found" }
          };
        }
      } catch (error) {
        console.log(error);

        return {
          status: "error",
          error: { message: "Something went wrong in customer api" }
        };
      }
    }
  );
}
