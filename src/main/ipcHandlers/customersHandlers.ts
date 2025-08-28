import { eq } from "drizzle-orm";
import { ipcMain } from "electron";
import type { ApiResponse, CustomersType } from "../../shared/types";
import { db } from "../db/db";
import { customers } from "../db/schema";

export default function customersHandlers() {
  // get all customers
  ipcMain.handle(
    "customersApi:getAllCustomers",
    async (): Promise<ApiResponse<CustomersType[]>> => {
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
    }
  );

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
            customerType: customerPayload.customerType
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
        return {
          status: "error",
          error: { message: "Something went wrong" }
        };
      }
    }
  );

  // update existing customer
  ipcMain.handle("customerApi:updateCustomer", async (_event, customerPayload: CustomersType) => {
    try {
      const result = db
        .update(customers)
        .set({
          name: customerPayload.id,
          contact: customerPayload.contact,
          customerType: customerPayload.customerType
        })
        .where(eq(customers.id, customerPayload.id))
        .run();

      if (result.changes > 0) {
        return { status: "success", data: "Successfully updated customer details" };
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
        error: { message: "Something went wrong" }
      };
    }
  });

  // delete existing customer
}
