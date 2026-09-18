import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { z } from "zod";

import type { AppEnv } from "../../app-env";
import {
  createPaymentMethod,
  deleteDailyEntry,
  getDailyEntry,
  listMonthSummaries,
  listPaymentMethods,
  listReceivedEntries,
  searchVendorNames,
  updatePaymentMethod
} from "./money.repository";
import {
  localDateSchema,
  overviewQuerySchema,
  paymentMethodCreateSchema,
  paymentMethodUpdateSchema,
  positiveIdSchema,
  receivedEntriesQuerySchema,
  receivedPaymentSchema,
  vendorPaymentSchema,
  vendorSearchSchema
} from "./money.schemas";
import { addReceivedPayment, addVendorPayment } from "./money.service";

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
  const [summaries, entry, paymentMethods] = await Promise.all([
    listMonthSummaries(context.env.DB, userId, query.year, query.month),
    getDailyEntry(context.env.DB, userId, query.date),
    listPaymentMethods(context.env.DB, userId, true)
  ]);
  return context.json({ summaries, entry, paymentMethods });
});

moneyRoutes.get("/days/:date", async (context) => {
  const date = parse(localDateSchema, context.req.param("date"));
  return context.json(await getDailyEntry(context.env.DB, context.get("userId"), date));
});

moneyRoutes.delete("/days/:date", async (context) => {
  const date = parse(localDateSchema, context.req.param("date"));
  await deleteDailyEntry(context.env.DB, context.get("userId"), date);
  return context.body(null, 204);
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
  await addReceivedPayment(context.env.DB, context.get("userId"), input);
  return context.body(null, 204);
});

moneyRoutes.post("/vendor-payments", async (context) => {
  const input = await jsonBody(context.req.raw, vendorPaymentSchema);
  await addVendorPayment(context.env.DB, context.get("userId"), input);
  return context.body(null, 204);
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
  const query = parse(vendorSearchSchema, context.req.query());
  return context.json(
    await searchVendorNames(context.env.DB, context.get("userId"), query.q)
  );
});
