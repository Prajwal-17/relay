import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCustomersInfinite } from "@/hooks/customers/useCustomersInfinite";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { processSyncQueue } from "@/utils/syncWorker";
import type { Customer } from "@shared/types";
import { formatRupee } from "@shared/utils/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, LoaderCircle, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

function rowHeight() {
  return 40;
}

export const CustomerNameInput = () => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const updateField = useBillingSessionStore((state) => state.updateField);
  const customerId = session?.customerId ?? null;
  const customerName = session?.customerName ?? "";

  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    customersData,
    status,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    search,
    setSearch
  } = useCustomersInfinite();

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setSearch("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, setSearch]);

  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  const createCustomerMutation = useMutation<Customer, Error, string>({
    mutationFn: (name: string) =>
      apiClient.post<Customer>("/api/customers", {
        name,
        contact: null,
        customerType: "cash"
      }),
    onSuccess: (data) => {
      updateField(activeTabId, "customerId", data.id);
      updateField(activeTabId, "customerName", data.name);
      setOpen(false);
      if (activeTabId) processSyncQueue(activeTabId);
      toast.success(`Created and selected customer: ${data.name}`);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast.error(error.message || "Error creating customer");
    }
  });

  const handleSelectCustomer = (customer: Customer) => {
    updateField(activeTabId, "customerId", customer.id);
    updateField(activeTabId, "customerName", customer.name);
    setOpen(false);
    if (activeTabId) processSyncQueue(activeTabId);
  };

  const handleCreateCustomer = () => {
    if (!search.trim()) return;
    createCustomerMutation.mutate(search.trim());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
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
      if (customer) handleSelectCustomer(customer);
    }
  };

  useEffect(() => {
    if (customersData.length > 0 && scrollRef.current) {
      const el = scrollRef.current;
      const targetTop = activeIndex * rowHeight();
      const visibleStart = el.scrollTop;
      const visibleEnd = visibleStart + el.clientHeight;
      if (targetTop < visibleStart || targetTop + rowHeight() > visibleEnd) {
        el.scrollTop = Math.max(0, targetTop - el.clientHeight / 2 + rowHeight() / 2);
      }
    }
  }, [activeIndex, customersData.length]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    const reachedEnd = scrollHeight - scrollTop - clientHeight < 80;

    if (reachedEnd && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  const isPending = status === "pending";
  const isEmpty = !isPending && customersData.length === 0 && !search.trim();
  const isNoResults = !isPending && customersData.length === 0 && search.trim();

  if (!activeTabId || !session) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="border-border/60 hover:bg-accent/50 h-10 w-96 justify-between bg-transparent px-4 text-base font-normal"
        >
          <span className="truncate">{customerName ? customerName : "Select Customer..."}</span>
          <ChevronsUpDown className="ml-3 h-5 w-5 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-40 w-96 p-0" align="start" onKeyDown={onKeyDown}>
        <div className="border-border/70 shrink-0 border-b px-2 py-1.5">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer..."
              className="border-input bg-muted/50 focus-visible:bg-background dark:bg-muted/50 h-8 rounded-lg pl-8 pr-8 text-sm shadow-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 transition-colors"
                aria-label="Clear customer search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[220px] shrink-0 overflow-auto"
        >
          {isPending ? (
            <div className="flex items-center justify-center py-6">
              <LoaderCircle className="text-muted-foreground size-4 animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="text-muted-foreground py-6 text-center text-xs">
              Type to search customers
            </div>
          ) : isNoResults ? (
            <div className="text-muted-foreground py-6 text-center text-xs">No customers found</div>
          ) : (
            <>
              {customersData.map((customer, index) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  isActive={index === activeIndex}
                  isSelected={customerId === customer.id}
                  onSelect={() => handleSelectCustomer(customer)}
                  onHover={() => setActiveIndex(index)}
                />
              ))}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-2">
                  <LoaderCircle className="text-muted-foreground size-3.5 animate-spin" />
                </div>
              )}
            </>
          )}
        </div>

        {search.trim() && !isPending && (
          <div className="border-border/70 border-t p-1.5">
            <Button
              onClick={handleCreateCustomer}
              disabled={createCustomerMutation.isPending}
              size="sm"
              className="w-full justify-center text-sm font-medium"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {createCustomerMutation.isPending ? "Creating..." : `Create "${search.trim()}"`}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

function CustomerRow({
  customer,
  isActive,
  isSelected,
  onSelect,
  onHover
}: {
  customer: Customer;
  isActive: boolean;
  isSelected: boolean;
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
      style={{ height: rowHeight() }}
      className={cn(
        "relative flex w-full items-center justify-between gap-2 px-3 text-left transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <span
        className={cn(
          "bg-primary absolute left-0 top-0 h-full w-0.5 rounded-r-full transition-opacity",
          isActive ? "opacity-100" : "opacity-0"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-[13px] font-medium leading-tight">
          {customer.name}
        </p>
        <p className="text-muted-foreground truncate text-[11px] leading-tight">
          {customer.contact ? customer.contact : "No contact"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            isDebit ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {outstanding === 0 ? "-" : formatRupee(Math.abs(outstanding))}
        </span>
        <Check
          className={cn("h-3.5 w-3.5", isSelected ? "text-primary opacity-100" : "opacity-0")}
        />
      </div>
    </button>
  );
}
