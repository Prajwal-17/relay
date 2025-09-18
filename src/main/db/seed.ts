import { faker } from "@faker-js/faker";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import type { CustomersType, ProductsType, SalesType, UsersType } from "../../shared/types";
import { customers, products, sales, users } from "./schema";

const dbPath = "/home/prajwal/.config/pos/pos.db";
const db = drizzle(dbPath);

export async function main() {
  try {
    console.log("Seeding started...");

    const usersData: (UsersType & { password: string })[] = Array.from({ length: 10 }).map(() => ({
      id: uuidv4(),
      name: faker.person.firstName(),
      role: "cashier",
      password: "password"
    }));

    const customersData: CustomersType[] = Array.from({ length: 10 }).map(() => ({
      id: uuidv4(),
      name: faker.person.firstName(),
      contact: faker.phone.number({ style: "national" }),
      customerType: Math.random() < 0.5 ? "cash" : "credit"
    }));

    const productsData: ProductsType[] = Array.from({ length: 10 }).map(() => ({
      id: uuidv4(),
      name: faker.commerce.product(),
      weight: faker.string.numeric(2),
      unit: faker.string.alpha(1),
      mrp: Number(faker.commerce.price()),
      price: Number(faker.commerce.price()),
      purchasePrice: Number(faker.commerce.price())
    }));

    const salesData: SalesType[] = Array.from({ length: 3 }).map(() => {
      const customer = faker.helpers.arrayElement(customersData);
      return {
        id: uuidv4(),
        invoiceNo: faker.number.int(),
        customerId: customer.id,
        customerName: customer.name,
        customerContact: null,
        grandTotal: faker.number.int(),
        isPaid: faker.datatype.boolean(),
        totalQuantity: faker.number.int()
      };
    });

    await db.insert(users).values(usersData);
    await db.insert(products).values(productsData);
    await db.insert(sales).values(salesData);
    // @ts-ignore : temp type fix
    await db.insert(customers).values(customersData);

    console.log("Seeding completed!");
  } catch (error) {
    console.error("Seed my error:", error);
  }
}

main();
