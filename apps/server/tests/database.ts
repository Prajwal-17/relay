import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Exercise the production Drizzle D1 queries against real SQLite, including batches.
type TestDatabase = D1Database & {
  sqlite: DatabaseSync;
  user: (id: string) => void;
  migrate: () => void;
};
type PreparedFixture = {
  all: () => Promise<{ results: Record<string, unknown>[]; success: boolean }>;
};

function migrationFiles(): string[] {
  const dir = new URL("../drizzle/", import.meta.url);
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => join(dir.pathname, file));
  if (files.length === 0) throw new Error("No drizzle migration files found.");
  return files;
}

function applyMigrations(sqlite: DatabaseSync) {
  sqlite.exec("BEGIN");
  try {
    for (const file of migrationFiles()) sqlite.exec(readFileSync(file, "utf8"));
    sqlite.exec("COMMIT");
  } catch (error) {
    sqlite.exec("ROLLBACK");
    throw error;
  }
}

export function testDatabase({ legacy = false } = {}): TestDatabase {
  void legacy;
  const sqlite = new DatabaseSync(":memory:");
  applyMigrations(sqlite);
  function migrate() {
    // Single squashed migration: the schema is already current, nothing to apply.
  }
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
