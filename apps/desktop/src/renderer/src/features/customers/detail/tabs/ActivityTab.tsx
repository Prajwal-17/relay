import { useCustomerActivity } from "@/features/customers/hooks/useCustomerActivity";
import { cn } from "@/lib/utils";
import type { ActivityKind } from "@shared/types";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import {
  CircleSlash,
  CreditCard,
  FileText,
  Plus,
  Receipt,
  Scale,
  Wallet,
  type LucideIcon
} from "lucide-react";
import { motion } from "motion/react";
import { SectionCard } from "../SectionCard";

const ACTIVITY_LIMIT = 50;

const kindIcon: Record<ActivityKind, LucideIcon> = {
  sale: Receipt,
  estimate: FileText,
  payment: CreditCard,
  adjustment: Scale,
  quick_sale: Plus,
  opening_balance: Wallet
};

const kindIconClass: Record<ActivityKind, string> = {
  sale: "text-info",
  estimate: "text-primary",
  payment: "text-success",
  adjustment: "text-muted-foreground",
  quick_sale: "text-warning",
  opening_balance: "text-muted-foreground"
};

function ActivitySkeleton() {
  return (
    <ol className="relative">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex gap-3 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <span className="bg-muted size-5 shrink-0 animate-pulse rounded" />
            <span className="bg-border mt-1 w-px flex-1" />
          </div>
          <div className="bg-background border-border/70 min-w-0 flex-1 rounded-lg border px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="bg-muted h-4 w-32 animate-pulse rounded" />
              <span className="bg-muted h-3 w-20 animate-pulse rounded" />
            </div>
            <span className="bg-muted mt-2 block h-3 w-3/4 animate-pulse rounded" />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ActivityTab({ customerId }: { customerId: string }) {
  const { activity, isFetching } = useCustomerActivity(customerId, ACTIVITY_LIMIT);

  return (
    <SectionCard title="Activity" description="Chronological timeline of customer events">
      {isFetching && activity.length === 0 ? (
        <ActivitySkeleton />
      ) : activity.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-12 text-center text-sm">
          <CircleSlash className="size-6 opacity-50" />
          No activity yet.
        </div>
      ) : (
        <ol className="relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.02 } } }}
          >
            {activity.map((event, idx) => {
              const Icon = kindIcon[event.kind] ?? CircleSlash;
              return (
                <motion.li
                  key={event.id}
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.12, ease: "easeOut" } }
                  }}
                  className="flex gap-3 pb-6 last:pb-0"
                >
                  <div className="flex flex-col items-center">
                    <Icon
                      className={cn(
                        "size-5 shrink-0",
                        kindIconClass[event.kind] ?? "text-muted-foreground"
                      )}
                    />
                    {idx < activity.length - 1 && <span className="bg-border mt-1 w-px flex-1" />}
                  </div>
                  <div className="bg-background border-border/70 min-w-0 flex-1 rounded-lg border px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-foreground text-sm font-semibold">{event.title}</p>
                      <time className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
                        {formatDateStrToISTDateTimeStr(event.date)}
                      </time>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-sm font-medium">
                      {event.description}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </motion.div>
        </ol>
      )}
    </SectionCard>
  );
}
