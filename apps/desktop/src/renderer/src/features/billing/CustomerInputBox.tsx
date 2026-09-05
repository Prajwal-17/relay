import { HighlightedText } from "@/components/app-ui/highlighted-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { shouldAutomaticallyAddSaleToAccounting } from "@/features/billing/billingAccounting";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCustomersInfinite } from "@/features/customers/hooks/useCustomersInfinite";
import { useAppPreferences } from "@/features/preferences/useAppPreferences";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { processSyncQueue } from "@/features/billing/syncWorker";
import { TRANSACTION_TYPE, type Customer } from "@shared/types";
import { formatRupee } from "@shared/utils/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, LoaderCircle, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  getScrollTopForActiveRow,
  hasPointerMoved,
  type PointerPosition
} from "../customers/listNavigation";

function rowHeight() {
  return 40;
}

export const CustomerNameInput = ({ customerType }: { customerType?: string | null }) => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const updatePersistentField = useBillingSessionStore((state) => state.updatePersistentField);
  const updateUiField = useBillingSessionStore((state) => state.updateUiField);
  const customerId = session?.customerId ?? null;
  const customerName = session?.customerName ?? "";

  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { config } = useAppPreferences();
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
    search,
    setSearch,
    isError,
    refetch,
    isFetchNextPageError
  } = useCustomersInfinite();

  const [activeIndex, setActiveIndex] = useState(0);

  const shouldAutoAddCustomer = (customer: Customer) =>
    shouldAutomaticallyAddSaleToAccounting({
      billingType: session?.billingType ?? TRANSACTION_TYPE.SALE,
      customer,
      defaultCustomerId: config?.billing.defaultCustomerId,
      enabled: config?.billing.autoAddAccountCustomerSales ?? false
    });

  useEffect(() => {
    if (open) {
      setSearch("");
      navigationIntentRef.current = "keyboard";
      pointerPositionRef.current = null;
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, setSearch]);

  useEffect(() => {
    navigationIntentRef.current = "keyboard";
    pointerPositionRef.current = null;
    setActiveIndex(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [search]);

  const createCustomerMutation = useMutation<Customer, Error, string>({
    mutationFn: (name: string) =>
      apiClient.post<Customer>("/api/customers", {
        name,
        contact: null,
        customerType: "cash"
      }),
    onSuccess: (data) => {
      updatePersistentField(activeTabId, "customerId", data.id);
      updateUiField(activeTabId, "customerName", data.name);
      updatePersistentField(activeTabId, "addToAccounting", shouldAutoAddCustomer(data));
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
    updatePersistentField(activeTabId, "customerId", customer.id);
    updateUiField(activeTabId, "customerName", customer.name);
    updatePersistentField(activeTabId, "addToAccounting", shouldAutoAddCustomer(customer));
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
      if (customer) handleSelectCustomer(customer);
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
          aria-label="Select customer"
          className="h-9 w-full min-w-0 justify-between px-3 text-sm font-normal"
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="min-w-0 truncate text-left" title={customerName || undefined}>
              {customerName ? customerName : "Select Customer..."}
            </span>
            {customerName && customerType && (
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 px-1.5 py-0 text-xs leading-tight font-semibold capitalize",
                  typeBadgeClass[customerType] ?? typeBadgeClass.cash
                )}
              >
                {customerType}
              </Badge>
            )}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-40 w-(--radix-popover-trigger-width) min-w-80 p-0"
        align="start"
        onKeyDown={onKeyDown}
      >
        <div className="border-border/70 shrink-0 border-b px-2 py-1.5">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer..."
              className="border-input bg-muted/50 focus-visible:bg-background dark:bg-muted/50 h-8 rounded-lg pr-8 pl-8 text-sm shadow-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  inputRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded p-0.5 transition-colors"
                aria-label="Clear customer search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="max-h-55 shrink-0 overflow-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-6">
              <LoaderCircle className="text-muted-foreground size-4 animate-spin" />
            </div>
          ) : isError && customersData.length === 0 ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-2 px-3 py-5 text-center text-xs"
            >
              <span className="text-muted-foreground">Customers could not be loaded.</span>
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
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
                  searchQuery={search}
                  onSelect={() => handleSelectCustomer(customer)}
                  onPointerMove={(event) => handlePointerMove(index, event)}
                />
              ))}
              {isFetchNextPageError && (
                <div className="border-border flex items-center justify-between border-t px-3 py-2 text-xs">
                  <span className="text-muted-foreground">More customers could not be loaded.</span>
                  <Button size="sm" variant="outline" onClick={() => void fetchNextPage()}>
                    Try again
                  </Button>
                </div>
              )}
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

const typeBadgeClass: Record<string, string> = {
  cash: "bg-hover text-foreground border-border",
  account: "bg-hover text-foreground border-border",
  hotel: "bg-hover text-foreground border-border"
};

function CustomerRow({
  customer,
  isActive,
  isSelected,
  searchQuery,
  onSelect,
  onPointerMove
}: {
  customer: Customer;
  isActive: boolean;
  isSelected: boolean;
  searchQuery: string;
  onSelect: () => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const outstanding = customer.outstandingBalance ?? 0;

  return (
    <button
      type="button"
      onPointerMove={onPointerMove}
      onClick={onSelect}
      style={{ height: rowHeight() }}
      className={cn(
        "relative flex w-full items-center justify-between gap-2 px-3 text-left transition-colors",
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
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="text-foreground min-w-0 truncate text-sm leading-tight font-medium">
            <HighlightedText text={customer.name} query={searchQuery} />
          </p>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 px-1.5 py-0 text-xs leading-tight font-semibold capitalize",
              typeBadgeClass[customer.customerType] ?? typeBadgeClass.cash
            )}
          >
            {customer.customerType}
          </Badge>
        </div>
        <p className="text-muted-foreground truncate text-xs leading-tight">
          <HighlightedText text={customer.contact || "No contact"} query={searchQuery} />
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            outstanding === 0 ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {outstanding === 0 ? "-" : formatRupee(Math.abs(outstanding))}
        </span>
        <Check
          className={cn("h-3.5 w-3.5", isSelected ? "text-marker opacity-100" : "opacity-0")}
        />
      </div>
    </button>
  );
}
