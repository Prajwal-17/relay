import type { DataMigration, DataMigrationContext } from "./types";

export type DataMigrationProgress = {
  current: number;
  total: number;
  label: string;
};

export function getPendingDataMigrations(
  context: DataMigrationContext,
  registry: readonly DataMigration[]
): DataMigration[] {
  const applied = new Set(
    context.sqlite
      .prepare("SELECT id FROM app_data_migrations")
      .all()
      .map((row) => (row as { id: string }).id)
  );

  return registry.filter((migration) => !applied.has(migration.id));
}

export function runDataMigrations(
  context: DataMigrationContext,
  migrations: readonly DataMigration[],
  onProgress?: (progress: DataMigrationProgress) => void
): void {
  migrations.forEach((migration, index) => {
    onProgress?.({ current: index + 1, total: migrations.length, label: migration.label });

    context.sqlite.transaction(() => {
      migration.run(context);
      context.sqlite.prepare("INSERT INTO app_data_migrations (id) VALUES (?)").run(migration.id);
    })();
  });
}
