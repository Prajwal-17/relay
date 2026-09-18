import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { z } from "zod";

import type { AppEnv } from "../../app-env";
import {
  createOnlineChannel,
  deleteDailyEntry,
  getDailyEntry,
  listMonthSummaries,
  listOnlineChannels,
  listReceiptEvents,
  listRecentVendorNames,
  updateOnlineChannel
} from "./money.repository";
import {
  channelCreateSchema,
  channelUpdateSchema,
  dailyEntryBodySchema,
  localDateSchema,
  overviewQuerySchema,
  receivedPaymentSchema,
  vendorPaymentSchema
} from "./money.schemas";
import {
  addReceivedPayment,
  addVendorPayment,
  saveDailyEntry,
  validateLedgerDate
} from "./money.service";

export const moneyRoutes = new Hono<AppEnv>();

async function jsonBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HTTPException(400, { message: "Send a valid JSON body." });
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HTTPException(400, {
      message: result.error.issues[0]?.message ?? "Request data is invalid."
    });
  }
  return result.data;
}

function pathDate(value: string): string {
  const parsed = localDateSchema.safeParse(value);
  if (!parsed.success) throw new HTTPException(400, { message: "Use a valid ledger date." });
  validateLedgerDate(parsed.data);
  return parsed.data;
}

function pathId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new HTTPException(400, { message: "Use a valid provider ID." });
  }
  return id;
}

moneyRoutes.get("/overview", async (context) => {
  const query = overviewQuerySchema.safeParse(context.req.query());
  if (!query.success) {
    throw new HTTPException(400, {
      message: query.error.issues[0]?.message ?? "Invalid ledger query."
    });
  }
  validateLedgerDate(query.data.date);
  const userId = context.get("userId");
  const [summaries, entry, channels] = await Promise.all([
    listMonthSummaries(context.env.DB, userId, query.data.year, query.data.month),
    getDailyEntry(context.env.DB, userId, query.data.date),
    listOnlineChannels(context.env.DB, userId, true)
  ]);
  return context.json({ summaries, entry, channels });
});

moneyRoutes.get("/days/:date", async (context) => {
  const date = pathDate(context.req.param("date"));
  return context.json(await getDailyEntry(context.env.DB, context.get("userId"), date));
});

moneyRoutes.put("/days/:date", async (context) => {
  const date = pathDate(context.req.param("date"));
  const input = await jsonBody(context.req.raw, dailyEntryBodySchema);
  await saveDailyEntry(context.env.DB, context.get("userId"), { date, ...input });
  return context.body(null, 204);
});

moneyRoutes.delete("/days/:date", async (context) => {
  const date = pathDate(context.req.param("date"));
  await deleteDailyEntry(context.env.DB, context.get("userId"), date);
  return context.body(null, 204);
});

moneyRoutes.get("/channels", async (context) => {
  const includeArchived = context.req.query("includeArchived") === "true";
  return context.json(
    await listOnlineChannels(context.env.DB, context.get("userId"), includeArchived)
  );
});

moneyRoutes.post("/channels", async (context) => {
  const input = await jsonBody(context.req.raw, channelCreateSchema);
  const channel = await createOnlineChannel(context.env.DB, context.get("userId"), input.name);
  return context.json(channel, 201);
});

moneyRoutes.patch("/channels/:id", async (context) => {
  const id = pathId(context.req.param("id"));
  const input = await jsonBody(context.req.raw, channelUpdateSchema);
  return context.json(await updateOnlineChannel(context.env.DB, context.get("userId"), id, input));
});

moneyRoutes.post("/received-payments", async (context) => {
  const input = await jsonBody(context.req.raw, receivedPaymentSchema);
  await addReceivedPayment(context.env.DB, context.get("userId"), input);
  return context.body(null, 204);
});

moneyRoutes.post("/vendor-payments", async (context) => {
  const input = await jsonBody(context.req.raw, vendorPaymentSchema);
  await addVendorPayment(context.env.DB, context.get("userId"), input);
  return context.body(null, 204);
});

moneyRoutes.get("/receipt-events", async (context) => {
  const date = pathDate(context.req.query("date") ?? "");
  const channel = context.req.query("channel");
  const channelId = channel === "cash" ? null : pathId(channel ?? "");
  const beforeRaw = context.req.query("beforeId");
  const beforeId = beforeRaw === undefined ? Number.MAX_SAFE_INTEGER : pathId(beforeRaw);
  return context.json(
    await listReceiptEvents(context.env.DB, context.get("userId"), date, channelId, beforeId)
  );
});

moneyRoutes.get("/vendors", async (context) => {
  const search = context.req.query("q")?.trim() ?? "";
  if (search.length > 120) throw new HTTPException(400, { message: "Search is too long." });
  return context.json(await listRecentVendorNames(context.env.DB, context.get("userId"), search));
});
