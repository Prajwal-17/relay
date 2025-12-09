import { like } from "drizzle-orm";
import { ipcMain } from "electron/main";
import type { ApiResponse, Customer } from "../../../shared/types";
import { db } from "../../db/db";
import { customers } from "../../db/schema";

export function searchCustomers() {
  // search customers by name
  ipcMain.handle(
    "customersApi:searchCustomers",
    async (_event, query): Promise<ApiResponse<Customer[]>> => {
      try {
        if (query === "") {
          const allCustomers = await db
            .select({
              id: customers.id,
              name: customers.name,
              contact: customers.contact,
              customerType: customers.customerType,
              createdAt: customers.createdAt,
              updatedAt: customers.updatedAt
            })
            .from(customers);
          return { status: "success", data: allCustomers };
        }
        const searchQuery = `${query}%`;
        const filteredCustomers = await db
          .select({
            id: customers.id,
            name: customers.name,
            contact: customers.contact,
            customerType: customers.customerType,
            createdAt: customers.createdAt,
            updatedAt: customers.updatedAt
          })
          .from(customers)
          .where(like(customers.name, searchQuery))
          .orderBy(customers.name);

        return { status: "success", data: filteredCustomers };
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
