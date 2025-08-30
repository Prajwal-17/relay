import { eq, like } from "drizzle-orm";
import { ipcMain } from "electron";
import type {
  AllTransactionsType,
  ApiResponse,
  CustomersType,
  FilteredGoogleContactsType
} from "../../shared/types";
import { db } from "../db/db";
import { customers, estimates, sales } from "../db/schema";
import importContactsFromGoogle from "./importContactsFromGoogle";

export default function customersHandlers() {
  // import contacts from google
  importContactsFromGoogle();

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
  ipcMain.handle("customersApi:updateCustomer", async (_event, customerPayload: CustomersType) => {
    try {
      const result = db
        .update(customers)
        .set({
          name: customerPayload.name,
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
  ipcMain.handle(
    "customersApi:deleteCustomer",
    async (_event, customerId: string): Promise<ApiResponse<string>> => {
      try {
        const existingTransactions = await db
          .select()
          .from(sales)
          .where(eq(sales.customerId, customerId));

        if (existingTransactions.length > 0) {
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

  // create imported customers
  ipcMain.handle(
    "customersApi:importContacts",
    async (_event, customerPayload: FilteredGoogleContactsType[]): Promise<ApiResponse<string>> => {
      try {
        const customerPay = customerPayload.map((c: FilteredGoogleContactsType) => ({
          name: c.name ?? "",
          contact: c.contact?.replace(/^\+91/, "") ?? "",
          customerType: "account"
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

  // get transaction wrt to customer id
  ipcMain.handle(
    "customersApi:getAllTransactionsById",
    async (_event, customerId): Promise<ApiResponse<AllTransactionsType>> => {
      try {
        const allSales = await db.select().from(sales).where(eq(sales.customerId, customerId));
        const allEstimates = await db
          .select()
          .from(estimates)
          .where(eq(estimates.customerId, customerId));

        return { status: "success", data: [...allSales, ...allEstimates] };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: { message: "Something went wrong" }
        };
      }
    }
  );

  // search customers by name
  ipcMain.handle(
    "customersApi:searchCustomers",
    async (_event, query): Promise<ApiResponse<CustomersType[]>> => {
      try {
        console.log(query);
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
