import { ipcMain } from "electron/main";
import type { ApiResponse, CustomersType } from "../../../shared/types";
import { db } from "../../db/db";
import { Role } from "../../db/enum";
import { customers } from "../../db/schema";

export function addCustomer() {
  // create new customer
  ipcMain.handle(
    "customersApi:addNewCustomer",
    async (_event, customerPayload: CustomersType): Promise<ApiResponse<string>> => {
      try {
        const newCustomer = db
          .insert(customers)
          .values({
            name: customerPayload.name,
            contact: customerPayload.contact,
            customerType: Role.CASH
          })
          .run();

        if (newCustomer.changes > 0) {
          return { status: "success", data: "Successfully created new customer" };
        } else {
          return {
            status: "error",
            error: { message: "No customer was added. Database changes were 0." }
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
