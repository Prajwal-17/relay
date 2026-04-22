import csv from "csv-parser";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { convertToPaisa } from "../../shared/utils/utils";
import { products } from "./schema";
import { generateProductSnapshot } from "../../shared/utils/productSnapshot";

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
        productSnapshot: generateProductSnapshot(product),
        weight: product.weight === "nil" ? null : product.weight,
        unit: product.unit,
        mrp: convertToPaisa(product.mrp),
        price: convertToPaisa(product.price)
      });
    });
    console.log("Finished CSV seeding Products");
  } catch (error) {
    console.log(error);
  }
}
main();
