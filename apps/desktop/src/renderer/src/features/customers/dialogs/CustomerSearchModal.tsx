import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCustomersInfinite } from "@/hooks/customers/useCustomersInfinite";
import { cn } from "@/lib/utils";
import type { Customer } from "@shared/types";
import { formatRupee } from "@shared/utils/utils";
import { LoaderCircle, Search, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export function CustomerSearchModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    parentRef,
    rowVirtualizer,
    customersData,
    status,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    totalCount,
    search,
    setSearch
  } = useCustomersInfinite();

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  const select = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (customersData.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, customersData.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const customer = customersData[activeIndex];
      if (customer) select(customer);
    }
  };

  useEffect(() => {
    if (customersData.length > 0) {
      rowVirtualizer.scrollToIndex(activeIndex, { align: "auto" });
    }
  }, [activeIndex, rowVirtualizer, customersData.length]);

  const isPending = status === "pending";
  const isEmpty = !isPending && customersData.length === 0;

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    const reachedEnd = scrollHeight - scrollTop - clientHeight < 80;

    if (reachedEnd && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={onKeyDown}
        className="border-border bg-popover flex max-h-[85vh] flex-col overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-xl"
      >
        <div className="border-border/70 shrink-0 border-b px-4 py-3">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name or contact…"
              className="border-input bg-muted/50 focus-visible:bg-background dark:bg-muted/50 h-10 rounded-lg pr-10 pl-9 text-sm shadow-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-md p-1 transition-colors"
                aria-label="Clear customer search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        <div ref={parentRef} onScroll={handleScroll} className="h-80 shrink-0 overflow-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <LoaderCircle className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center px-6 pb-8 text-center">
              <span className="border-border/70 bg-muted/60 text-muted-foreground mb-3 flex size-11 items-center justify-center rounded-full border">
                <Users className="size-5" />
              </span>
              <p className="text-foreground text-sm font-semibold">
                {search.trim() ? "No customers found" : "No customers yet"}
              </p>
              <p className="text-muted-foreground mt-1 max-w-56 text-sm leading-5">
                {search.trim()
                  ? "Try a different name or contact."
                  : "Add a customer to get started."}
              </p>
            </div>
          ) : (
            <>
              {customersData.map((customer, index) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  isActive={index === activeIndex}
                  onSelect={() => select(customer)}
                  onHover={() => setActiveIndex(index)}
                />
              ))}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                  <LoaderCircle className="text-muted-foreground size-5 animate-spin" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-border/70 text-muted-foreground flex shrink-0 items-center justify-between border-t px-3 py-2 text-xs font-medium">
          <span className="tabular-nums">
            {totalCount > 0
              ? `${totalCount} ${totalCount === 1 ? "customer" : "customers"}`
              : "0 customers"}
          </span>
          <span>↑ ↓ navigate · ↵ select</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CustomerRow({
  customer,
  isActive,
  onSelect,
  onHover
}: {
  customer: Customer;
  isActive: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const outstanding = customer.outstandingBalance ?? 0;
  const isDebit = outstanding > 0;

  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-center justify-between gap-3 py-2.5 pr-3 pl-4 text-left transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <span
        className={cn(
          "bg-primary absolute top-0 left-0 h-full w-0.5 rounded-r-full transition-opacity",
          isActive ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="min-w-0">
        <p className="text-foreground truncate text-sm font-medium">{customer.name}</p>
        <p className="text-muted-foreground truncate text-xs font-medium">
          {customer.contact ? customer.contact : "No contact"}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          isDebit ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {outstanding === 0 ? "—" : formatRupee(Math.abs(outstanding))}
      </span>
    </button>
  );
}
