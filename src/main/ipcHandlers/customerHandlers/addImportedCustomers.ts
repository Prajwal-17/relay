import { ipcMain } from "electron/main";
import type { ApiResponse, FilteredGoogleContactsType } from "../../../shared/types";
import { db } from "../../db/db";
import { CustomerRole } from "../../db/enum";
import { customers } from "../../db/schema";

export function addImportedCustomers() {
  // create imported customers
  ipcMain.handle(
    "customersApi:importContacts",
    async (_event, customerPayload: FilteredGoogleContactsType[]): Promise<ApiResponse<string>> => {
      try {
        const customerPay = customerPayload.map((c: FilteredGoogleContactsType) => ({
          name: c.name ?? "",
          contact: c.contact?.replace(/^\+91/, "") ?? "",
          customerType: CustomerRole.CASH
        }));
        const newCustomer = db
          .insert(customers)
          .values([...customerPay])
          .run();

        if (newCustomer.changes > 0) {
          return { status: "success", data: "Successfully imported customers" };
        } else {
          return {
            status: "error",
            error: { message: "No customer was added. Database changes were 0." }
          };
        }
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
