import { and, desc, eq, sql } from "drizzle-orm";
import type { SQLiteDatabase } from "expo-sqlite";
import { onlineChannels } from "@/lib/db/schema";
import { createMoneyOrm } from "@/lib/db/orm";
import type { OnlineChannel } from "../money.types";
import type { MoneyDatabase } from "@/types/database.types";

export async function getOnlineChannel(
  db: MoneyDatabase,
  id: number
): Promise<OnlineChannel | undefined> {
  return db.select().from(onlineChannels).where(eq(onlineChannels.id, id)).get();
}

export async function listOnlineChannels(
  client: SQLiteDatabase,
  includeArchived = false
): Promise<OnlineChannel[]> {
  return createMoneyOrm(client)
    .select()
    .from(onlineChannels)
    .where(includeArchived ? undefined : eq(onlineChannels.isArchived, false))
    .orderBy(
      desc(onlineChannels.isPreset),
      sql`CASE WHEN ${onlineChannels.isPreset} THEN ${onlineChannels.id} END`,
      sql`${onlineChannels.name} COLLATE NOCASE`
    )
    .all();
}

function channelName(name: string): string {
  if (!name.trim()) throw new Error("Enter a channel name.");
  return name.trim();
}

function channelError(error: unknown): never {
  if (
    String(error instanceof Error && error.cause ? error.cause : error)
      .toLowerCase()
      .includes("unique")
  )
    throw new Error("A channel with this name already exists.");
  throw error;
}

export async function createOnlineChannel(
  client: SQLiteDatabase,
  name: string
): Promise<OnlineChannel> {
  const trimmed = channelName(name);
  const now = new Date().toISOString();
  try {
    return await createMoneyOrm(client)
      .insert(onlineChannels)
      .values({ name: trimmed, createdAt: now, updatedAt: now })
      .returning()
      .get();
  } catch (error) {
    return channelError(error);
  }
}

export async function renameOnlineChannel(
  client: SQLiteDatabase,
  id: number,
  name: string
): Promise<void> {
  const trimmed = channelName(name);
  try {
    const result = await createMoneyOrm(client)
      .update(onlineChannels)
      .set({ name: trimmed, updatedAt: new Date().toISOString() })
      .where(and(eq(onlineChannels.id, id), eq(onlineChannels.isPreset, false)))
      .returning({ id: onlineChannels.id })
      .get();
    if (!result) throw new Error("Preset channels cannot be renamed.");
  } catch (error) {
    channelError(error);
  }
}

export async function setOnlineChannelArchived(
  client: SQLiteDatabase,
  id: number,
  archived: boolean
): Promise<void> {
  const result = await createMoneyOrm(client)
    .update(onlineChannels)
    .set({ isArchived: archived, updatedAt: new Date().toISOString() })
    .where(and(eq(onlineChannels.id, id), eq(onlineChannels.isPreset, false)))
    .returning({ id: onlineChannels.id })
    .get();
  if (!result) throw new Error("Preset channels cannot be archived.");
}
