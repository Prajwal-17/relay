import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CUSTOMER_SORT_OPTIONS } from "@/constants";
import { useCustomersInfinite } from "@/hooks/customers/useCustomersInfinite";
import { cn } from "@/lib/utils";
import {
  CUSTOMER_SORT_BY,
  CUSTOMER_TYPE,
  type CustomerSortByType,
  type CustomerType
} from "@shared/types";
import { ArrowDownAZ, Check, ChevronDown, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerActions } from "../customerActions";
import { CustomerListTable } from "./CustomerListTable";
import { toCustomerListRow } from "./types";

const TYPE_FILTERS: { key: CustomerType; label: string }[] = [
  { key: CUSTOMER_TYPE.ALL, label: "All" },
  { key: CUSTOMER_TYPE.CASH, label: "Cash" },
  { key: CUSTOMER_TYPE.ACCOUNT, label: "Account" },
  { key: CUSTOMER_TYPE.HOTEL, label: "Hotel" }
];

export function CustomerListPage() {
  const navigate = useNavigate();
  const { openAddForm } = useCustomerActions();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const {
    customersData,
    status,
    isFetchingNextPage,
    isFetching,
    isPlaceholderData,
    hasNextPage,
    fetchNextPage,
    totalCount,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    includeArchived,
    setIncludeArchived,
    debouncedQuery
  } = useCustomersInfinite();

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const rows = useMemo(() => customersData.map(toCustomerListRow), [customersData]);

  const dataKey = useMemo(
    () => `${debouncedQuery}::${typeFilter}::${sortBy}::${includeArchived}`,
    [debouncedQuery, typeFilter, sortBy, includeArchived]
  );

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [dataKey]);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, rows.length - 1)));
  }, [rows.length]);

  const handleRowClick = (row: { id: string }) => {
    navigate(`/customers/${row.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (rows.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[activeIndex];
      if (row) handleRowClick(row);
    }
  };

  const activeTypeLabel = TYPE_FILTERS.find((f) => f.key === typeFilter)?.label ?? "All";
  const activeSortLabel = CUSTOMER_SORT_OPTIONS.find((s) => s.value === sortBy)?.label;
  const hasTypeFilter = typeFilter !== CUSTOMER_TYPE.ALL;
  const hasSort = sortBy !== CUSTOMER_SORT_BY.NAME_ASC;
  const hasFilters = search !== "" || hasTypeFilter || includeArchived;

  const filterCount = (hasTypeFilter ? 1 : 0) + (includeArchived ? 1 : 0);

  const clearFilters = () => {
    setSearch("");
    setTypeFilter(CUSTOMER_TYPE.ALL);
    setSortBy(CUSTOMER_SORT_BY.NAME_ASC);
    setIncludeArchived(false);
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4" onKeyDown={handleKeyDown}>
      <div className="shrink-0 space-y-2.5">
        <motion.div
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" as const }}
          className="border-border bg-card flex items-center gap-2.5 rounded-xl border px-3 py-2.5 shadow-xs"
        >
          <div className="relative w-96 min-w-0">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers…"
              className="bg-muted/60 focus-visible:border-ring focus-visible:bg-background h-9 rounded-md border-transparent pr-9 pl-9 text-base shadow-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-md p-1 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="border-border bg-muted/50 text-foreground hover:bg-muted/60 relative h-9 cursor-pointer gap-2 px-3 text-sm font-medium shadow-none transition-colors"
              >
                <SlidersHorizontal className="size-4" />
                Filter
                {filterCount > 0 && (
                  <span className="bg-primary text-primary-foreground ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold">
                    {filterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="border-border/80 w-64 rounded-xl p-0">
              <div className="text-foreground px-4 pt-3 pb-2 text-sm font-semibold tracking-tight">
                Filters
              </div>
              <Separator />
              <div className="p-3">
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  Type
                </p>
                <div className="space-y-0.5">
                  {TYPE_FILTERS.map((option) => {
                    const active = typeFilter === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setTypeFilter(option.key)}
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-foreground/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        {option.label}
                        {active && <Check className="text-foreground size-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Separator />
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Show archived
                  </p>
                  <Switch
                    checked={includeArchived}
                    onCheckedChange={setIncludeArchived}
                  />
                </div>
              </div>
              {(hasTypeFilter || includeArchived) && (
                <>
                  <Separator />
                  <div className="p-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTypeFilter(CUSTOMER_TYPE.ALL);
                        setIncludeArchived(false);
                      }}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 w-full cursor-pointer justify-center gap-1.5 text-xs font-medium"
                    >
                      <X className="size-3.5" />
                      Clear all filters
                    </Button>
                  </div>
                </>
              )}
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-border bg-muted/50 text-foreground hover:bg-muted/60 h-9 cursor-pointer gap-2 px-3 text-sm font-medium shadow-none transition-colors"
              >
                <ArrowDownAZ className="size-4" />
                {activeSortLabel ?? "Sort"}
                <ChevronDown className="size-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 rounded-xl">
              <DropdownMenuLabel className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Sort by
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortBy}
                onValueChange={(v) => setSortBy(v as CustomerSortByType)}
              >
                {CUSTOMER_SORT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <DropdownMenuRadioItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer gap-2.5 rounded-lg py-2 text-sm font-medium"
                    >
                      <Icon className="size-4 opacity-60" />
                      {option.label}
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
              {hasSort && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSortBy(CUSTOMER_SORT_BY.NAME_ASC)}
                    className="text-muted-foreground cursor-pointer justify-center rounded-lg py-2 text-xs font-medium"
                  >
                    Clear sort
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-muted-foreground ml-auto shrink-0 text-sm font-medium tabular-nums select-none">
            {totalCount} {totalCount === 1 ? "customer" : "customers"}
          </div>

          <Button
            onClick={openAddForm}
            className="hover:bg-primary-hover h-9 cursor-pointer gap-1.5 px-3.5 text-sm font-semibold"
          >
            <Plus className="size-4" />
            New Customer
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" as const }}
          className="border-border/60 bg-card flex flex-wrap items-center gap-2.5 rounded-xl border px-3 py-2.5"
        >
          <FilterChip
            label="Type"
            value={activeTypeLabel}
            onRemove={hasTypeFilter ? () => setTypeFilter(CUSTOMER_TYPE.ALL) : undefined}
          />
          {includeArchived && (
            <FilterChip
              label="Archived"
              value="Yes"
              onRemove={() => setIncludeArchived(false)}
            />
          )}
          {hasSort && (
            <FilterChip
              label="Sort"
              value={activeSortLabel ?? sortBy}
              onRemove={() => setSortBy(CUSTOMER_SORT_BY.NAME_ASC)}
            />
          )}
          {(hasTypeFilter || includeArchived || hasSort) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-destructive hover:bg-destructive/10 flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors"
            >
              <X className="size-3.5" />
              Clear all
            </button>
          )}
        </motion.div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <CustomerListTable
          key={dataKey}
          rows={rows}
          activeIndex={activeIndex}
          hasNextPage={hasNextPage}
          hasFilters={hasFilters}
          status={status}
          isFetchingNextPage={isFetchingNextPage}
          isFetching={isFetching}
          isPlaceholderData={isPlaceholderData}
          fetchNextPage={fetchNextPage}
          onRowClick={handleRowClick}
          clearFilters={clearFilters}
        />
      </div>
    </div>
  );
}

function FilterChip({
  label,
  value,
  onRemove
}: {
  label: string;
  value: string;
  onRemove?: () => void;
}) {
  return (
    <span className="border-border bg-muted/60 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors">
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="font-semibold">{value}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-md p-0.5 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
}
