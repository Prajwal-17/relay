import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { EmptyTab } from "../shared/EmptyTab";
import type { LucideIcon } from "lucide-react";

type TxnItem = {
  id: string;
  number: string;
  date: string;
  status: "paid" | "unpaid";
  amount: number;
};

export function TransactionTable({
  items,
  numberLabel,
  newLabel,
  emptyIcon,
  emptyTitle,
  emptyDescription
}: {
  items: TxnItem[];
  numberLabel: string;
  newLabel: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (i) => !search.trim() || i.number.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search by ${numberLabel.toLowerCase()}…`}
            className="h-9 w-64 pl-9"
          />
        </div>
        <Button className="hover:bg-primary-hover h-9 cursor-pointer">
          <Plus className="size-4" />
          {newLabel}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border-border rounded-xl border shadow-xs">
          <EmptyTab
            icon={emptyIcon}
            title={search ? "No matches" : emptyTitle}
            description={search ? "Try a different search term." : emptyDescription}
          />
        </div>
      ) : (
        <div className="bg-card border-border overflow-hidden rounded-xl border shadow-xs">
          <div className="bg-muted text-muted-foreground grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold tracking-wide uppercase">
            <div className="col-span-4">{numberLabel}</div>
            <div className="col-span-3">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Amount</div>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.02 } }
            }}
          >
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.12, ease: "easeOut" } }
                }}
                className="border-border/70 hover:bg-accent grid grid-cols-12 items-center gap-2 border-b px-4 py-2.5 text-sm transition-colors last:border-b-0"
              >
                <div className="text-foreground col-span-4 truncate font-medium tabular-nums">
                  {item.number}
                </div>
                <div className="text-muted-foreground col-span-3 font-medium tabular-nums">
                  {formatDateStr(item.date)}
                </div>
                <div className="col-span-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium capitalize",
                      item.status === "paid"
                        ? "bg-success/15 text-success border-success/25"
                        : "bg-warning/15 text-warning border-warning/30"
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="text-foreground col-span-3 text-right font-semibold tabular-nums">
                  {formatRupee(item.amount)}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
