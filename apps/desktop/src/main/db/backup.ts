import type Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const BACKUP_DIRECTORY = "backups";
const LATEST_BACKUP_NAME = "relay-before-upgrade-latest.db";

export function getBackupPaths(databasePath: string) {
  const directory = path.join(path.dirname(databasePath), BACKUP_DIRECTORY);
  return {
    directory,
    latest: path.join(directory, LATEST_BACKUP_NAME),
    marker: path.join(directory, LATEST_BACKUP_NAME + ".json")
  };
}

export function hasBackupForUpgrade(databasePath: string, upgradeKey: string): boolean {
  const paths = getBackupPaths(databasePath);
  try {
    const marker = JSON.parse(fs.readFileSync(paths.marker, "utf8")) as { upgradeKey?: string };
    return marker.upgradeKey === upgradeKey && fs.existsSync(paths.latest);
  } catch {
    return false;
  }
}

export async function createLatestBackup(
  sqlite: Database.Database,
  databasePath: string,
  upgradeKey: string
): Promise<string> {
  const paths = getBackupPaths(databasePath);
  fs.mkdirSync(paths.directory, { recursive: true });

  const temporary = path.join(
    paths.directory,
    `.${LATEST_BACKUP_NAME}.${process.pid}.${Date.now()}.tmp`
  );

  try {
    await sqlite.backup(temporary);
    fs.renameSync(temporary, paths.latest);
    fs.writeFileSync(paths.marker, JSON.stringify({ upgradeKey }), "utf8");
    return paths.latest;
  } catch (error) {
    fs.rmSync(temporary, { force: true });
    throw error;
  }
}
