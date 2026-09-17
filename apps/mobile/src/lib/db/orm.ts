import { drizzle, type AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";
import type { SQLiteDatabase } from "expo-sqlite";

import * as moneySchema from "./schema";

// Drizzle builds and binds queries; Expo SQLite executes them asynchronously.
function executor(client: SQLiteDatabase): AsyncRemoteCallback {
  return async (query, params, method) => {
    const statement = await client.prepareAsync(query);
    try {
      if (method === "run") {
        await statement.executeAsync(params);
        return { rows: [] };
      }
      const result = await statement.executeForRawResultAsync(params);
      return {
        rows: method === "get" ? (await result.getFirstAsync())! : await result.getAllAsync()
      };
    } finally {
      await statement.finalizeAsync();
    }
  };
}

export const createMoneyOrm = (client: SQLiteDatabase) =>
  drizzle(executor(client), { schema: moneySchema });
