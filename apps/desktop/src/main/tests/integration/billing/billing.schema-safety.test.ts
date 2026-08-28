import { describe, expect, it } from "vitest";
import { saleTxnPayloadSchema } from "../../../../shared/schemas/transaction.schema";
import { salePayload, transactionItem } from "../../helpers";

type RawPayload = ReturnType<typeof salePayload>;
type InvalidMutation = (payload: RawPayload) => void;

function validPayload(): RawPayload {
  return salePayload(crypto.randomUUID(), {
    transactionNo: 1,
    items: [transactionItem()]
  });
}

describe("billing transaction schema safety", () => {
  const invalidCases: Array<[string, InvalidMutation]> = [
    [
      "fractional milli-unit quantity",
      (payload: RawPayload) => (payload.items[0]!.quantity = 1000.5)
    ],
    ["fractional checked quantity", (payload: RawPayload) => (payload.items[0]!.checkedQty = 0.5)],
    [
      "checked quantity above quantity",
      (payload: RawPayload) => (payload.items[0]!.checkedQty = 1001)
    ],
    ["empty item name", (payload: RawPayload) => (payload.items[0]!.name = "   ")],
    [
      "empty product snapshot",
      (payload: RawPayload) => (payload.items[0]!.productSnapshot = "   ")
    ],
    [
      "unsafe price integer",
      (payload: RawPayload) => (payload.items[0]!.price = Number.MAX_SAFE_INTEGER + 1)
    ],
    [
      "unsafe quantity integer",
      (payload: RawPayload) => (payload.items[0]!.quantity = Number.MAX_SAFE_INTEGER + 1)
    ],
    [
      "money calculation above the safe integer range",
      (payload: RawPayload) => {
        payload.items[0]!.price = Number.MAX_SAFE_INTEGER;
        payload.items[0]!.quantity = 2000;
      }
    ],
    ["fractional transaction number", (payload: RawPayload) => (payload.transactionNo = 1.5)],
    [
      "more than 500 items",
      (payload: RawPayload) => {
        payload.items = Array.from({ length: 501 }, () => transactionItem());
      }
    ],
    [
      "item name over 300 characters",
      (payload: RawPayload) => (payload.items[0]!.name = "n".repeat(301))
    ],
    [
      "product snapshot over 500 characters",
      (payload: RawPayload) => (payload.items[0]!.productSnapshot = "s".repeat(501))
    ],
    ["notes over 2,000 characters", (payload: RawPayload) => (payload.notes = "x".repeat(2001))]
  ];

  it.each(invalidCases)("rejects %s", (_label, mutate) => {
    const payload = validPayload();
    mutate(payload);

    expect(saleTxnPayloadSchema.safeParse({ data: payload }).success).toBe(false);
  });
});
