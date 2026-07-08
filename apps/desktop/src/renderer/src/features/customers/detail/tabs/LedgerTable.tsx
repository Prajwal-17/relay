import { AnimatePresence, motion } from "motion/react";
import { formatRupee } from "@shared/utils/utils";
import type { LedgerEntry } from "../../_mock/types";
import { LedgerRow } from "./LedgerRow";

export function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

  return (
    <div className="bg-card border-border overflow-hidden rounded-xl border shadow-xs">
      {/* Header */}
      <div className="bg-muted text-muted-foreground grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold tracking-wide uppercase">
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Ref</div>
        <div className="col-span-3">Description</div>
        <div className="col-span-1 text-right">Debit</div>
        <div className="col-span-1 text-right">Credit</div>
        <div className="col-span-1 text-right">Balance</div>
      </div>

      {/* Rows */}
      <AnimatePresence initial={false}>
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.12, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <LedgerRow entry={entry} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Footer totals */}
      <div className="bg-muted/60 border-border/70 grid grid-cols-12 items-center gap-2 border-t px-4 py-2.5 text-sm">
        <div className="text-muted-foreground col-span-9 font-semibold tracking-wide uppercase">
          Totals
        </div>
        <div className="text-foreground col-span-1 text-right font-semibold tabular-nums">
          {formatRupee(totalDebit)}
        </div>
        <div className="text-foreground col-span-1 text-right font-semibold tabular-nums">
          {formatRupee(totalCredit)}
        </div>
        <div className="col-span-1" />
      </div>
    </div>
  );
}
