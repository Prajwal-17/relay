import { eq } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, CustomersType } from "../../../shared/types";
import { db } from "../../db/db";
import { Role } from "../../db/enum";
import { customers } from "../../db/schema";

export function updateCustomer() {
  // update existing customer
  ipcMain.handle(
    "customersApi:updateCustomer",
    async (_event, customerPayload: CustomersType): Promise<ApiResponse<CustomersType>> => {
      try {
        const result = await db
          .update(customers)
          .set({
            name: customerPayload.name,
            contact: customerPayload.contact,
            customerType: Role.CASH
          })
          .where(eq(customers.id, customerPayload.id))
          .returning();

        if (result) {
          return {
            status: "success",
            data: result[0],
            message: "Customer updated successfully"
          };
        } else {
          return {
            status: "error",
            error: { message: "Customer not found" }
          };
        }
      } catch (error) {
        console.log(error);
        if (error && (error as any).code === "SQLITE_CONSTRAINT_UNIQUE") {
          return {
            status: "error",
            error: { message: `Customer with name "${customerPayload.name}" already exists.` }
          };
        }
        return {
          status: "error",
          error: { message: "Something went wrong" }
        };
      }
    }
  );
}
