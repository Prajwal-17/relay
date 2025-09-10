import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { app } from "electron";
import fs from "fs";
import path from "node:path";
import * as schema from "./schema";

//getPath returs os specific directory
const dbPath = path.join(app.getPath("userData"), "pos.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
console.log("dbpath", dbPath);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema, logger: true });

// migrations are applied at startup only if there is a change
const migrationsFolder = app.isPackaged
  ? path.join(process.resourcesPath, "drizzle")
  : path.join(__dirname, "../../drizzle");
console.log("folder", migrationsFolder);

if (fs.existsSync(migrationsFolder)) {
  migrate(db, { migrationsFolder });
} else {
  console.error("Drizzle migrations folder not found at:", migrationsFolder);
}
