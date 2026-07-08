import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { OutstandingBadge } from "../detail/shared/OutstandingBadge";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { mockCustomers } from "../_mock/data";

/**
 * Customer switcher palette (E6 overlay). Placeholder for a global Ctrl+K
 * binding (plan §6 — wiring deferred). Selecting a row swaps the detail view
 * and closes the modal via the parent's onSelect.
 */
export function CustomerSearchModal({
  onSelect,
  onClose
}: {
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mockCustomers;
    return mockCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.contact ?? "").toLowerCase().includes(q) ||
        (c.gstin ?? "").toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="bg-popover border-border overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-lg"
      >
        {/* Search header */}
        <div className="border-border/70 flex items-center gap-2 border-b px-3">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a customer name, contact, or GSTIN…"
            className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <kbd className="bg-muted text-muted-foreground rounded-md border px-1.5 py-0.5 text-xs font-medium">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-auto">
          {results.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm font-medium">
              No customers match &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="py-1">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className="hover:bg-accent flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-foreground truncate text-sm font-medium">{c.name}</p>
                      <p className="text-muted-foreground truncate text-xs font-medium">
                        {c.contact ?? "No contact"}
                        {c.gstin ? ` · ${c.gstin}` : ""}
                      </p>
                    </div>
                    <OutstandingBadge outstanding={c.outstanding} size="sm" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-border/70 text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-xs font-medium">
          <span>
            {results.length} result{results.length === 1 ? "" : "s"}
          </span>
          <span>↑ ↓ to navigate · ↵ to select</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
