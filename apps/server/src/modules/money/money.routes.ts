import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { z } from "zod";

import type { AppEnv } from "../../app-env";
import {
  deleteDailyEntry,
  deleteVendorPayment,
  getDailyEntry,
  listMonthSummaries,
  listPaymentMethods,
  listReceivedEntries,
  listReceivedCounts,
  searchVendorNames,
  listMoneyDays,
  getMoneyDay,
  listVendorNames,
  getReceivedEntryById,
  getVendorPaymentById
} from "./money.repository";
import {
  localDateSchema,
  overviewQuerySchema,
  paymentMethodCreateSchema,
  paymentMethodUpdateSchema,
  positiveIdSchema,
  receivedEntriesQuerySchema,
  receivedPaymentSchema,
  receivedPaymentUpdateSchema,
  vendorPaymentUpdateSchema,
  summariesQuerySchema,
  vendorPaymentSchema,
  vendorSearchSchema,
  weekQuerySchema
} from "./money.schemas";
import {
  addReceivedPayment,
  addVendorPayment,
  deleteReceivedPayment,
  createPaymentMethod,
  updatePaymentMethod,
  getReceivedHistory,
  updateReceivedPayment,
  updateVendorPayment
} from "./money.service";

export const moneyRoutes = new Hono<AppEnv>();

function parse<TSchema extends z.ZodType>(schema: TSchema, value: unknown): z.infer<TSchema> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new HTTPException(400, {
      message: result.error.issues[0]?.message ?? "Request data is invalid."
    });
  }
  return result.data;
}

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
  return parse(schema, body);
}

moneyRoutes.get("/overview", async (context) => {
  const query = parse(overviewQuerySchema, context.req.query());
  const userId = context.get("userId");
  const [summaries, entry, paymentMethods, receivedCounts] = await Promise.all([
    listMonthSummaries(context.env.DB, userId, query.year, query.month),
    getDailyEntry(context.env.DB, userId, query.date),
    listPaymentMethods(context.env.DB, userId, true),
    listReceivedCounts(context.env.DB, userId, query.date)
  ]);
  return context.json({ summaries, entry, paymentMethods, receivedCounts });
});

moneyRoutes.get("/weeks", async (context) => {
  const { startDate, endDate } = parse(weekQuerySchema, context.req.query());
  const userId = context.get("userId");
  const [days, paymentMethods] = await Promise.all([
    listMoneyDays(context.env.DB, userId, startDate, endDate),
    listPaymentMethods(context.env.DB, userId, true)
  ]);
  return context.json({ startDate, endDate, days, paymentMethods });
});

moneyRoutes.get("/received-history", async (context) => {
  const query = parse(receivedEntriesQuerySchema, context.req.query());
  return context.json(
    await getReceivedHistory(
      context.env.DB,
      context.get("userId"),
      query.date,
      query.paymentMethod === "cash" ? null : query.paymentMethod,
      query.beforeId
    )
  );
});

moneyRoutes.get("/summaries", async (context) => {
  const { year, month } = parse(summariesQuerySchema, context.req.query());
  return context.json(await listMonthSummaries(context.env.DB, context.get("userId"), year, month));
});

moneyRoutes.get("/days/:date", async (context) => {
  const date = parse(localDateSchema, context.req.param("date"));
  return context.json(await getDailyEntry(context.env.DB, context.get("userId"), date));
});

moneyRoutes.delete("/days/:date", async (context) => {
  const date = parse(localDateSchema, context.req.param("date"));
  await deleteDailyEntry(context.env.DB, context.get("userId"), date);
  return context.json({
    day: { date, entry: null, receivedCounts: [] },
    vendorNames: await listVendorNames(context.env.DB, context.get("userId"))
  });
});

moneyRoutes.get("/payment-methods", async (context) => {
  const includeArchived = context.req.query("includeArchived") === "true";
  return context.json(
    await listPaymentMethods(context.env.DB, context.get("userId"), includeArchived)
  );
});

moneyRoutes.post("/payment-methods", async (context) => {
  const input = await jsonBody(context.req.raw, paymentMethodCreateSchema);
  const method = await createPaymentMethod(context.env.DB, context.get("userId"), input.name);
  return context.json(method, 201);
});

moneyRoutes.patch("/payment-methods/:id", async (context) => {
  const id = parse(positiveIdSchema, context.req.param("id"));
  const input = await jsonBody(context.req.raw, paymentMethodUpdateSchema);
  return context.json(await updatePaymentMethod(context.env.DB, context.get("userId"), id, input));
});

moneyRoutes.post("/received-payments", async (context) => {
  const input = await jsonBody(context.req.raw, receivedPaymentSchema);
  return context.json(await addReceivedPayment(context.env.DB, context.get("userId"), input));
});

moneyRoutes.delete("/received-entries/:id", async (context) => {
  const id = parse(positiveIdSchema, context.req.param("id"));
  return context.json(await deleteReceivedPayment(context.env.DB, context.get("userId"), id));
});

moneyRoutes.post("/vendor-payments", async (context) => {
  const input = await jsonBody(context.req.raw, vendorPaymentSchema);
  return context.json(await addVendorPayment(context.env.DB, context.get("userId"), input));
});

moneyRoutes.delete("/vendor-payments/:id", async (context) => {
  const id = parse(positiveIdSchema, context.req.param("id"));
  const date = await deleteVendorPayment(context.env.DB, context.get("userId"), id);
  if (!date) throw new HTTPException(404, { message: "Vendor payment not found." });
  const [day, vendorNames] = await Promise.all([
    getMoneyDay(context.env.DB, context.get("userId"), date),
    listVendorNames(context.env.DB, context.get("userId"))
  ]);
  return context.json({ day, vendorNames });
});

moneyRoutes.get("/received-entries", async (context) => {
  const query = parse(receivedEntriesQuerySchema, context.req.query());
  const paymentMethodId = query.paymentMethod === "cash" ? null : query.paymentMethod;
  return context.json(
    await listReceivedEntries(
      context.env.DB,
      context.get("userId"),
      query.date,
      paymentMethodId,
      query.beforeId
    )
  );
});

moneyRoutes.get("/vendors", async (context) => {
  if (context.req.query("q") === undefined) {
    return context.json(await listVendorNames(context.env.DB, context.get("userId")));
  }
  const query = parse(vendorSearchSchema, context.req.query());
  return context.json(await searchVendorNames(context.env.DB, context.get("userId"), query.q));
});

moneyRoutes.get("/received-entries/:id", async (context) => {
  const id = parse(positiveIdSchema, context.req.param("id"));
  const entry = await getReceivedEntryById(context.env.DB, context.get("userId"), id);
  if (!entry) throw new HTTPException(404, { message: "Payment entry not found." });
  return context.json({ ...entry, kind: "received" });
});

moneyRoutes.get("/vendor-payments/:id", async (context) => {
  const id = parse(positiveIdSchema, context.req.param("id"));
  const entry = await getVendorPaymentById(context.env.DB, context.get("userId"), id);
  if (!entry) throw new HTTPException(404, { message: "Vendor payment not found." });
  return context.json({ ...entry, kind: "vendor" });
});

moneyRoutes.patch("/received-entries/:id", async (context) => {
  const id = parse(positiveIdSchema, context.req.param("id"));
  const input = await jsonBody(context.req.raw, receivedPaymentUpdateSchema);
  return context.json(
    await updateReceivedPayment(context.env.DB, context.get("userId"), id, input)
  );
});

moneyRoutes.patch("/vendor-payments/:id", async (context) => {
  const id = parse(positiveIdSchema, context.req.param("id"));
  const input = await jsonBody(context.req.raw, vendorPaymentUpdateSchema);
  return context.json(await updateVendorPayment(context.env.DB, context.get("userId"), id, input));
});
