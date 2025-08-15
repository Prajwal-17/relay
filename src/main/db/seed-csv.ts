import csv from "csv-parser";
import fs from "fs";
import { products } from "./schema";
import { v4 as uuidv4 } from "uuid";
import { drizzle } from "drizzle-orm/better-sqlite3";

const dbPath = "/home/prajwal/.config/pos/pos.db";
const db = drizzle(dbPath);

const readable = fs.createReadStream("/home/prajwal/Documents/Products.csv", {
  encoding: "utf-8"
});

async function main() {
  try {
    console.log("Start CSV seeding Products");
    readable.pipe(csv()).forEach(async (product) => {
      await db.insert(products).values({
        id: uuidv4(),
        name: product.name,
        weight: "none", // temp
        unit: "pc", // temp
        mrp: 0, // temp
        price: product.price
      });
    });
    console.log("Finished CSV seeding Products");
  } catch (error) {
    console.log(error);
  }
}
main();
