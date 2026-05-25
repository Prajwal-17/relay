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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PRODUCT_SORT_OPTIONS, PRODUCT_STATUS_OPTIONS } from "@/constants";
import { PRODUCTSEARCH_TYPE, useProductSearch } from "@/hooks/products/useProductSearch";
import { useProductsStore } from "@/store/productsStore";
import { PRODUCT_FILTER, type ProductFilterType } from "@shared/types";
import {
  ArrowDownAZ,
  Check,
  ChevronDown,
  Grid3X3,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ProductHeader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setActionType = useProductsStore((state) => state.setActionType);
  const filterType = useProductsStore((state) => state.filterType);
  const setFilterType = useProductsStore((state) => state.setFilterType);
  const viewMode = useProductsStore((state) => state.viewMode);
  const setViewMode = useProductsStore((state) => state.setViewMode);
  const sortBy = useProductsStore((state) => state.sortBy);
  const setSortBy = useProductsStore((state) => state.setSortBy);
  const priceMin = useProductsStore((state) => state.priceMin);
  const setPriceMin = useProductsStore((state) => state.setPriceMin);
  const priceMax = useProductsStore((state) => state.priceMax);
  const setPriceMax = useProductsStore((state) => state.setPriceMax);
  const hasMrp = useProductsStore((state) => state.hasMrp);
  const toggleMrpFilter = useProductsStore((state) => state.toggleMrpFilter);
  const hasPurchasePrice = useProductsStore((state) => state.hasPurchasePrice);
  const togglePurchasePriceFilter = useProductsStore((state) => state.togglePurchasePriceFilter);
  const activeFilters = useProductsStore((state) => state.activeFilters);
  const removeActiveFilter = useProductsStore((state) => state.removeActiveFilter);
  const clearActiveFilters = useProductsStore((state) => state.clearActiveFilters);

  const { productsSearchParam, setProductsSearchParam } = useProductSearch(
    PRODUCTSEARCH_TYPE.PRODUCTPAGE
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const activeSortLabel = PRODUCT_SORT_OPTIONS.find((s) => s.value === sortBy)?.label;
  const activeFilterCount =
    activeFilters.length +
    (filterType !== PRODUCT_FILTER.ACTIVE ? 1 : 0) +
    (priceMin || priceMax ? 1 : 0) +
    (hasMrp ? 1 : 0) +
    (hasPurchasePrice ? 1 : 0);

  return (
    <div className="sticky top-0 z-10 space-y-2.5">
      <div className="border-border bg-card flex items-center gap-3.5 rounded-xl border px-5 py-4 shadow-sm">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-5 h-7 w-7 -translate-y-1/2" />
          <Input
            ref={inputRef}
            placeholder="Search products…"
            value={productsSearchParam}
            onChange={(e) => setProductsSearchParam(e.target.value)}
            className="bg-muted/40 focus-visible:border-borderprimary focus-visible:bg-background h-16 rounded-xl border-transparent pr-14 pl-15 text-2xl! font-medium shadow-none transition-colors"
          />
          {productsSearchParam && (
            <button
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer rounded-md p-1.5 transition-colors"
              onClick={() => {
                setProductsSearchParam("");
                inputRef.current?.focus();
              }}
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="border-border bg-muted/30 text-foreground hover:bg-muted/60 relative cursor-pointer gap-2.5 px-5 text-lg font-semibold shadow-none transition-all"
            >
              <SlidersHorizontal className="h-5 w-5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="bg-primary text-primary-foreground ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="border-border/80 w-80 rounded-xl p-0 shadow-lg">
            <div className="px-5 pt-3 pb-3">
              <h4 className="text-foreground text-base font-semibold tracking-tight">Filters</h4>
            </div>
            <Separator />

            <div className="p-5">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Status
              </p>
              <div className="space-y-1">
                {PRODUCT_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterType(option.value as ProductFilterType)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3.5 py-2.5 text-base font-medium transition-colors ${
                      filterType === option.value
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    {option.label}
                    {filterType === option.value && <Check className="text-foreground h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="p-5">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Price Range
              </p>
              <div className="flex items-center gap-2.5">
                <Input
                  type="number"
                  placeholder="Min ₹"
                  className="h-10 [appearance:textfield] text-sm"
                  value={priceMin ?? ""}
                  onChange={(e) => setPriceMin(e.target.value || null)}
                />
                <span className="text-muted-foreground text-sm">–</span>
                <Input
                  type="number"
                  placeholder="Max ₹"
                  className="h-10 [appearance:textfield] text-sm"
                  value={priceMax ?? ""}
                  onChange={(e) => setPriceMax(e.target.value || null)}
                />
              </div>
            </div>

            <Separator />

            <div className="p-5">
              <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                Properties
              </p>
              <div className="space-y-1">
                <button
                  onClick={toggleMrpFilter}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3.5 py-2.5 text-base font-medium transition-colors ${
                    hasMrp
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  Has MRP
                  {hasMrp && <Check className="text-foreground h-4 w-4" />}
                </button>
                <button
                  onClick={togglePurchasePriceFilter}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3.5 py-2.5 text-base font-medium transition-colors ${
                    hasPurchasePrice
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  Has Purchase Price
                  {hasPurchasePrice && <Check className="text-foreground h-4 w-4" />}
                </button>
              </div>
            </div>

            {(filterType !== PRODUCT_FILTER.ACTIVE ||
              priceMin ||
              priceMax ||
              hasMrp ||
              hasPurchasePrice) && (
              <>
                <Separator />
                <div className="p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterType(PRODUCT_FILTER.ACTIVE);
                      setPriceMin(null);
                      setPriceMax(null);
                      if (hasMrp) toggleMrpFilter();
                      if (hasPurchasePrice) togglePurchasePriceFilter();
                    }}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 w-full cursor-pointer justify-center gap-1.5 text-sm font-medium"
                  >
                    <X className="h-4 w-4" />
                    Clear selection
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
              size="lg"
              className="border-border bg-muted/30 text-foreground hover:bg-muted/60 cursor-pointer gap-2.5 px-5 text-lg font-semibold shadow-none transition-all"
            >
              <ArrowDownAZ className="h-5 w-5" />
              {activeSortLabel ?? "Sort"}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-xl">
            <DropdownMenuLabel className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Sort by
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
              {PRODUCT_SORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className="cursor-pointer gap-2.5 rounded-lg py-2.5 text-base font-medium"
                  >
                    <Icon className="h-4 w-4 opacity-60" />
                    {option.label}
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
            {sortBy && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSortBy("")}
                  className="text-muted-foreground cursor-pointer justify-center rounded-lg py-2 text-sm font-medium"
                >
                  Clear sort
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-10!" />

        {/* view mode toggle */}
        <div className="border-border bg-muted/30 flex items-center gap-1 rounded-lg border p-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setViewMode("list")}
                className={`cursor-pointer rounded-md p-2.5 transition-all ${
                  viewMode === "list"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-sm">
              List view
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setViewMode("grid")}
                className={`cursor-pointer rounded-md p-2.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-sm">
              Grid view
            </TooltipContent>
          </Tooltip>
        </div>

        <Button
          onClick={() => {
            setActionType("add");
            setOpenProductDialog();
          }}
          className="bg-primary hover:bg-primary/85 text-primary-foreground h-12 cursor-pointer gap-2.5 rounded-lg px-6 text-base font-semibold shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Add Product
        </Button>
      </div>

      {/* active filters */}
      <div className="border-border/60 bg-card flex flex-wrap items-center gap-3 rounded-xl border px-5 py-3.5">
        <FilterChip
          label="Status"
          value={PRODUCT_STATUS_OPTIONS.find((s) => s.value === filterType)?.label ?? filterType}
          onRemove={
            filterType !== PRODUCT_FILTER.ACTIVE
              ? () => setFilterType(PRODUCT_FILTER.ACTIVE)
              : undefined
          }
        />

        {sortBy && (
          <FilterChip
            label="Sort"
            value={activeSortLabel ?? sortBy}
            onRemove={() => setSortBy("")}
          />
        )}

        {activeFilters.map((filter) => (
          <FilterChip
            key={filter.key}
            label={filter.label}
            value={filter.value}
            onRemove={() => removeActiveFilter(filter.key)}
          />
        ))}

        {(priceMin || priceMax) && (
          <FilterChip
            label="Price"
            value={
              priceMin && priceMax
                ? `₹${priceMin} - ₹${priceMax}`
                : priceMin
                  ? `≥ ₹${priceMin}`
                  : `≤ ₹${priceMax}`
            }
            onRemove={() => {
              setPriceMin(null);
              setPriceMax(null);
            }}
          />
        )}

        {hasMrp && <FilterChip label="Has MRP" value="Yes" onRemove={toggleMrpFilter} />}

        {hasPurchasePrice && (
          <FilterChip label="Has Purchase Price" value="Yes" onRemove={togglePurchasePriceFilter} />
        )}

        <button
          onClick={() => setFilterOpen(true)}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-base font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add filter
        </button>

        {(activeFilters.length > 0 ||
          filterType !== PRODUCT_FILTER.ACTIVE ||
          sortBy ||
          priceMin ||
          priceMax ||
          hasMrp ||
          hasPurchasePrice) && <Separator orientation="vertical" className="h-6!" />}
        {(activeFilters.length > 0 ||
          filterType !== PRODUCT_FILTER.ACTIVE ||
          sortBy ||
          priceMin ||
          priceMax ||
          hasMrp ||
          hasPurchasePrice) && (
          <button
            onClick={() => {
              clearActiveFilters();
              setFilterType(PRODUCT_FILTER.ACTIVE);
              setSortBy("");
              setPriceMin(null);
              setPriceMax(null);
              if (hasMrp) toggleMrpFilter();
              if (hasPurchasePrice) togglePurchasePriceFilter();
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/8 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-base font-semibold transition-colors"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
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
    <span className="border-border bg-muted/40 text-foreground inline-flex items-center gap-2 rounded-lg border py-2 pr-2.5 pl-3.5 text-lg font-medium transition-all">
      <span className="text-muted-foreground text-base">{label}:</span>
      <span className="font-semibold">{value}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-0.5 cursor-pointer rounded-md p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </span>
  );
}
