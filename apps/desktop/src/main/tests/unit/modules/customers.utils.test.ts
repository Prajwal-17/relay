import { describe, expect, it } from "vitest";
import { LEDGER_ENTRY_TYPE } from "../../../../shared/types";
import { formatRupee } from "../../../../shared/utils/utils";
import type { LedgerEventRow } from "../../../modules/customers/customers.types";
import { mapLedgerEvent } from "../../../modules/customers/customers.utils";

const ledgerRow = (overrides: Partial<LedgerEventRow> = {}): LedgerEventRow => ({
  id: "entry-1",
  type: LEDGER_ENTRY_TYPE.PAYMENT,
  amountDue: 0,
  amountPaid: 0,
  paymentMode: null,
  notes: null,
  createdAt: "2026-07-29T10:00:00.000Z",
  ...overrides
});

describe("mapLedgerEvent", () => {
  it("maps payments with default and explicit payment metadata", () => {
    expect(mapLedgerEvent(ledgerRow({ amountPaid: 2500 }))).toEqual({
      id: "ledger:entry-1",
      date: "2026-07-29T10:00:00.000Z",
      kind: "payment",
      title: "Payment received",
      description: `${formatRupee(2500)} via cash`
    });

    expect(
      mapLedgerEvent(ledgerRow({ amountPaid: 5000, paymentMode: "upi", notes: "advance" }))
        .description
    ).toBe(`${formatRupee(5000)} via upi — advance`);
  });

  it("maps due and paid adjustments using their signed balance effect", () => {
    expect(
      mapLedgerEvent(
        ledgerRow({
          type: LEDGER_ENTRY_TYPE.ADJUSTMENT,
          amountDue: 1500,
          amountPaid: 0,
          notes: null
        })
      )
    ).toMatchObject({
      kind: "adjustment",
      title: "Balance adjusted",
      description: `Manual adjustment (${formatRupee(-1500)})`
    });

    expect(
      mapLedgerEvent(
        ledgerRow({
          type: LEDGER_ENTRY_TYPE.ADJUSTMENT,
          amountDue: 0,
          amountPaid: 500,
          notes: "round-off"
        })
      ).description
    ).toBe(`round-off (${formatRupee(500)})`);
  });

  it("maps quick sales and opening balances with optional notes", () => {
    expect(
      mapLedgerEvent(
        ledgerRow({
          type: LEDGER_ENTRY_TYPE.QUICK_SALE,
          amountDue: 12000,
          notes: "counter"
        })
      )
    ).toMatchObject({
      kind: "quick_sale",
      title: "Quick sale recorded",
      description: `${formatRupee(12000)} — counter`
    });

    expect(
      mapLedgerEvent(
        ledgerRow({
          type: LEDGER_ENTRY_TYPE.OPENING_BALANCE,
          amountDue: 7500,
          notes: null
        })
      )
    ).toMatchObject({
      kind: "opening_balance",
      title: "Opening balance set",
      description: formatRupee(7500)
    });
  });

  it("maps unknown ledger types to a safe generic activity", () => {
    expect(mapLedgerEvent(ledgerRow({ type: "legacy_entry", notes: "Imported entry" }))).toEqual({
      id: "ledger:entry-1",
      date: "2026-07-29T10:00:00.000Z",
      kind: "adjustment",
      title: "Ledger entry",
      description: "Imported entry"
    });
  });
});
