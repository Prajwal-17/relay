import { useProductHistory } from "@/hooks/products/useProductHistory";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { formatToRupees } from "@shared/utils/utils";
import { AlertCircle, ArrowRight, Clock, Clock3, Loader2 } from "lucide-react";
import { motion } from "motion/react";

function DiffRow({
  label,
  oldVal,
  newVal
}: {
  label: string;
  oldVal: number | null;
  newVal: number | null;
}) {
  if (oldVal === null && newVal === null) return null;
  if (oldVal === newVal) return null;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-secondary-foreground text-base font-semibold">{label}</span>
      <div className="flex items-center gap-3 text-[0.95rem]">
        <span className="text-muted-foreground decoration-muted-foreground/40 text-base font-medium line-through">
          {oldVal ? formatToRupees(oldVal) : "N/A"}
        </span>
        <ArrowRight className="text-muted-foreground/30 h-4 w-4" strokeWidth={3} />
        <span className="text-base font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
          {newVal ? formatToRupees(newVal) : "N/A"}
        </span>
      </div>
    </div>
  );
}

export function ProductHistoryTimeline({ productId }: { productId: string | null | undefined }) {
  const { data, isLoading, error } = useProductHistory(productId);

  if (!productId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground/50 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive flex h-full w-full flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="mb-4 h-10 w-10 opacity-80" />
        <p className="text-lg font-semibold">Failed to load version history</p>
        <p className="text-destructive/80 mt-1 text-sm">Please try again later.</p>
      </div>
    );
  }

  const entries = data?.entries || [];

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="flex h-full w-full flex-col items-center justify-center"
      >
        <div className="bg-secondary mb-5 flex h-20 w-20 items-center justify-center rounded-3xl shadow-sm">
          <Clock className="text-muted-foreground/50 h-8 w-8" />
        </div>
        <h3 className="text-foreground mb-2 text-xl font-bold tracking-tight">No Changes Yet</h3>
        <p className="text-muted-foreground max-w-xs text-center text-[0.95rem]">
          This product has not been changed or updated yet.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-8 py-6">
        <div className="mb-6">
          <h3 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
            Pricing History
          </h3>
        </div>

        <div className="relative">
          <div className="bg-border/60 absolute top-4 bottom-6 left-2.75 w-0.5 rounded-full" />

          <div className="flex flex-col gap-6">
            {entries.map((entry, idx) => (
              <motion.div
                key={entry.createdAt + idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="group relative flex gap-8"
              >
                {/* timeline dot */}
                <div className="bg-muted-foreground/30 ring-background group-hover:bg-primary z-10 mt-1.25 flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm ring-4 transition-all duration-300 group-hover:scale-110">
                  <div className="bg-background group-hover:bg-primary-foreground h-2 w-2 rounded-full transition-colors" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="text-muted-foreground/80 group-hover:text-muted-foreground mb-3 flex items-center gap-2 text-base font-semibold tracking-normal transition-colors">
                    <Clock3 className="h-4 w-4" />
                    {entry.createdAt ? formatDateStrToISTDateTimeStr(entry.createdAt) : "-"}
                  </div>

                  <div className="bg-card/50 border-border/40 hover:border-border/80 overflow-hidden rounded-2xl border shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
                    <div className="flex flex-col gap-0 px-6 py-4">
                      <DiffRow
                        label="Selling Price"
                        oldVal={entry.oldPrice}
                        newVal={entry.newPrice}
                      />
                      <DiffRow
                        label="Purchase Price"
                        oldVal={entry.oldPurchasePrice}
                        newVal={entry.newPurchasePrice}
                      />
                      <DiffRow label="MRP" oldVal={entry.oldMrp} newVal={entry.newMrp} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
