import csv from "csv-parser";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { products } from "./schema";

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
        weight: product.weight === "nil" ? null : product.weight,
        unit: product.unit,
        mrp: product.mrp,
        price: product.price
      });
    });
    console.log("Finished CSV seeding Products");
  } catch (error) {
    console.log(error);
  }
}
main();
