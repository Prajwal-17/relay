import { cn } from "@/lib/utils";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { processSyncQueue } from "@/features/billing/syncWorker";
import { StickyNote } from "lucide-react";

type BillingNotesProps = { className?: string };

const BillingNotes = ({ className }: BillingNotesProps) => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const notes = useBillingSessionStore((state) =>
    activeTabId ? (state.sessions[activeTabId]?.notes ?? "") : ""
  );
  const updateField = useBillingSessionStore((state) => state.updateField);

  return (
    <section
      className={cn(
        "bg-card border-border/60 flex h-full flex-col rounded-2xl border p-4 shadow-sm",
        className
      )}
    >
      <header className="mb-3 flex items-center gap-2">
        <div className="bg-muted/60 border-border/70 flex size-8 items-center justify-center rounded-lg border">
          <StickyNote className="text-primary size-4" />
        </div>
        <h2 className="text-foreground text-sm font-semibold tracking-tight">Notes</h2>
      </header>
      <textarea
        value={notes}
        onChange={(e) => {
          if (!activeTabId) return;
          updateField(activeTabId, "notes", e.target.value);
          processSyncQueue(activeTabId);
        }}
        placeholder="Delivery instructions, remarks, internal notes…"
        className="border-input placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-ring/50 min-h-32 w-full flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
      />
    </section>
  );
};

export default BillingNotes;
