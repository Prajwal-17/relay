import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readFileSync } from "node:fs";

// Exercise the production Drizzle D1 queries against real SQLite, including batches.
type TestDatabase = D1Database & {
  sqlite: DatabaseSync;
  user: (id: string) => void;
  migrate: () => void;
};
type PreparedFixture = {
  all: () => Promise<{ results: Record<string, unknown>[]; success: boolean }>;
};

export function testDatabase({ legacy = false } = {}): TestDatabase {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../drizzle/0000_real_warbound.sql", import.meta.url), "utf8"));
  function migrate() {
    sqlite.exec("BEGIN");
    try {
      sqlite.exec(
        readFileSync(new URL("../drizzle/0001_money_ledger.sql", import.meta.url), "utf8")
      );
      sqlite.exec("COMMIT");
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  }
  if (!legacy) migrate();
  const prepare = (query: string, params: SQLInputValue[] = []) => {
    const statement = sqlite.prepare(query);
    return {
      bind: (...values: SQLInputValue[]) => prepare(query, values),
      async all() {
        return { results: statement.all(...params), success: true };
      },
      async raw() {
        statement.setReturnArrays(true);
        return statement.all(...params);
      },
      async run() {
        return { results: [], success: true, meta: statement.run(...params) };
      }
    };
  };
  return {
    sqlite,
    migrate,
    prepare,
    async batch(statements: PreparedFixture[]) {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.all());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    user(id: string) {
      sqlite
        .prepare(
          "INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, 0, 0)"
        )
        .run(id, id, `${id}@example.test`);
    }
  } as unknown as TestDatabase;
}
