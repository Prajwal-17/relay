import { SectionCard } from "../shared/SectionCard";
import { cn } from "@/lib/utils";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { motion } from "motion/react";
import {
  CreditCard,
  FileText,
  Pencil,
  ReceiptText,
  StickyNote,
  Settings as SettingsIcon,
  type LucideIcon
} from "lucide-react";
import type { ActivityEvent } from "../../_mock/types";
import { mockActivity } from "../../_mock/data";

const kindIcon: Record<ActivityEvent["kind"], LucideIcon> = {
  sale: ReceiptText,
  payment: CreditCard,
  estimate: FileText,
  edit: Pencil,
  note: StickyNote,
  system: SettingsIcon
};

const kindIconClass: Record<ActivityEvent["kind"], string> = {
  sale: "bg-info/15 text-info",
  payment: "bg-success/15 text-success",
  estimate: "bg-primary/10 text-primary",
  edit: "bg-muted text-muted-foreground",
  note: "bg-warning/15 text-warning",
  system: "bg-muted text-muted-foreground"
};

export function ActivityTab() {
  const events = mockActivity;

  return (
    <SectionCard title="Activity" description="Chronological timeline of customer events">
      <ol className="relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.02 } } }}
        >
          {events.map((event, idx) => {
            const Icon = kindIcon[event.kind];
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
                  <span
                    className={cn(
                      "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full",
                      kindIconClass[event.kind]
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  {idx < events.length - 1 && <span className="bg-border mt-1 w-px flex-1" />}
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
    </SectionCard>
  );
}
