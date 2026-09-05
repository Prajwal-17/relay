import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCustomersInfinite } from "@/features/customers/hooks/useCustomersInfinite";
import { cn } from "@/lib/utils";
import type { Customer } from "@shared/types";
import { formatRupee } from "@shared/utils/utils";
import { LoaderCircle, Search, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerTypeBadge } from "../CustomerTypeBadge";
import { getScrollTopForActiveRow, hasPointerMoved, type PointerPosition } from "../listNavigation";

function rowHeight() {
  return 44;
}

export function CustomerSearchModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigationIntentRef = useRef<"keyboard" | "pointer">("keyboard");
  const pointerPositionRef = useRef<PointerPosition | null>(null);

  const {
    customersData,
    status,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    totalCount,
    search,
    setSearch,
    isError,
    refetch,
    isFetchNextPageError
  } = useCustomersInfinite();

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    navigationIntentRef.current = "keyboard";
    pointerPositionRef.current = null;
    setActiveIndex(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
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

    if (e.target !== inputRef.current) return;
    if (customersData.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      navigationIntentRef.current = "keyboard";
      setActiveIndex((i) => Math.min(i + 1, customersData.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigationIntentRef.current = "keyboard";
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const customer = customersData[activeIndex];
      if (customer) select(customer);
    }
  };

  useEffect(() => {
    if (
      navigationIntentRef.current === "keyboard" &&
      customersData.length > 0 &&
      scrollRef.current
    ) {
      const el = scrollRef.current;
      el.scrollTop = getScrollTopForActiveRow({
        activeIndex,
        rowHeight: rowHeight(),
        scrollTop: el.scrollTop,
        clientHeight: el.clientHeight
      });
    }
  }, [activeIndex, customersData.length]);

  const handlePointerMove = (index: number, event: React.PointerEvent) => {
    const nextPosition = { x: event.clientX, y: event.clientY };
    if (!hasPointerMoved(pointerPositionRef.current, nextPosition)) return;

    pointerPositionRef.current = nextPosition;
    navigationIntentRef.current = "pointer";
    setActiveIndex(index);
  };

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
        className="border-border bg-popover flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-(--radius-panel) p-0 shadow-lg sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Switch customer</DialogTitle>
        <DialogDescription className="sr-only">
          Search for a customer and select their workspace.
        </DialogDescription>
        <div className="border-border shrink-0 border-b px-3 py-2.5">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name or contact…"
              className="bg-background h-9 pr-10 pl-9 text-sm shadow-none"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setSearch("");
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 -translate-y-1/2"
                aria-label="Clear customer search"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="h-80 shrink-0 overflow-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <LoaderCircle className="text-muted-foreground size-5 animate-spin" />
            </div>
          ) : isError && customersData.length === 0 ? (
            <div
              role="alert"
              className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center"
            >
              <p className="text-muted-foreground text-sm">Customers could not be loaded.</p>
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center px-6 pb-8 text-center">
              <span className="bg-muted text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-(--radius-panel)">
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
                  onPointerMove={(event) => handlePointerMove(index, event)}
                />
              ))}
              {isFetchNextPageError && (
                <div
                  role="alert"
                  className="border-border flex items-center justify-between border-t px-3 py-2 text-xs"
                >
                  <span className="text-muted-foreground">More customers could not be loaded.</span>
                  <Button size="sm" variant="outline" onClick={() => void fetchNextPage()}>
                    Try again
                  </Button>
                </div>
              )}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                  <LoaderCircle className="text-muted-foreground size-5 animate-spin" />
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-border text-muted-foreground flex shrink-0 items-center justify-between border-t px-3 py-2 text-xs font-medium">
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
  onPointerMove
}: {
  customer: Customer;
  isActive: boolean;
  onSelect: () => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const outstanding = customer.outstandingBalance ?? 0;

  return (
    <button
      type="button"
      onPointerMove={onPointerMove}
      onClick={onSelect}
      aria-selected={isActive}
      style={{ height: rowHeight() }}
      className={cn(
        "focus-visible:ring-ring relative flex w-full items-center justify-between gap-3 pr-3 pl-4 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset",
        "hover:bg-hover",
        isActive && "bg-selected"
      )}
    >
      <span
        className={cn(
          "bg-marker absolute top-0 left-0 h-full w-0.5 rounded-r-full transition-opacity",
          isActive ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-foreground min-w-0 truncate text-sm leading-tight font-medium">
            {customer.name}
          </p>
          <CustomerTypeBadge customerType={customer.customerType} className="leading-tight" />
        </div>
        <p className="text-muted-foreground truncate text-xs leading-tight font-medium">
          {customer.contact ? customer.contact : "No contact"}
        </p>
      </div>
      <span
        className={cn(
          "min-w-16 shrink-0 text-right text-sm font-semibold tabular-nums",
          outstanding === 0 ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {outstanding === 0 ? "—" : formatRupee(Math.abs(outstanding))}
      </span>
    </button>
  );
}
