import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, CustomersType } from "../../../shared/types";
import { db } from "../../db/db";
import { customers } from "../../db/schema";

export function getCustomerById() {
  // get Customer by id
  ipcMain.handle(
    "customersApi:getCustomerById",
    async (_event, customerId): Promise<ApiResponse<Partial<CustomersType>>> => {
      try {
        const customer = await db
          .select({
            id: customers.id,
            name: customers.name,
            contact: customers.contact ?? null
          })
          .from(customers)
          .where(eq(customers.id, customerId));

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
