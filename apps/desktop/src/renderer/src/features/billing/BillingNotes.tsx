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
  const updatePersistentField = useBillingSessionStore((state) => state.updatePersistentField);

  return (
    <section className={cn("flex flex-col", className)}>
      <header className="border-frame mb-2 flex h-8 items-center gap-2 border-b px-2">
        <StickyNote className="text-muted-foreground size-4" aria-hidden="true" />
        <h2 className="text-foreground text-sm font-semibold">Notes</h2>
      </header>
      <textarea
        aria-label="Billing notes"
        value={notes}
        onChange={(e) => {
          if (!activeTabId) return;
          updatePersistentField(activeTabId, "notes", e.target.value);
          processSyncQueue(activeTabId);
        }}
        placeholder="Delivery instructions, remarks, internal notes…"
        className="border-input bg-card placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring min-h-24 w-full resize-none rounded-(--radius-control) border px-3 py-2 text-sm transition-[color,box-shadow] outline-none focus-visible:ring-2"
      />
    </section>
  );
};

export default BillingNotes;
