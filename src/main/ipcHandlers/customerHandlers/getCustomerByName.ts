import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, Customer } from "../../../shared/types";
import { db } from "../../db/db";
import { customers } from "../../db/schema";

export function getCustomerByName() {
  // get Customer by name
  ipcMain.handle(
    "customersApi:getCustomerByName",
    async (_event, customerName): Promise<ApiResponse<Partial<Customer | null>>> => {
      try {
        const customer = await db
          .select({
            id: customers.id,
            name: customers.name,
            contact: customers.contact ?? null
          })
          .from(customers)
          .where(eq(customers.name, customerName));

        if (customer.length <= 0) {
          return { status: "success", data: null };
        }

        return { status: "success", data: customer[0] };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: { message: "Something went wrong" }
        };
      }
    }
  );
}
