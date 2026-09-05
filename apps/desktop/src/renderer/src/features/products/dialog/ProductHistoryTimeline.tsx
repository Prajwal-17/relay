import { ErrorState } from "@/components/app-ui/ErrorState";
import { useProductHistory } from "@/features/products/hooks/useProductHistory";
import { useProductsStore } from "@/features/products/products.store";
import { Clock3, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { ProductHistoryHeader } from "./product-history/ProductHistoryHeader";
import { ProductPriceChangesTable } from "./product-history/ProductPriceChangesTable";
import { ProductPriceTrend } from "./product-history/ProductPriceTrend";
import { PRICE_METRICS } from "./product-history/productHistory.config";
import { buildPriceChanges, getCurrentValue } from "./product-history/productHistory.utils";
import type { HistoryView, PriceMetric, TrendRange } from "./product-history/productHistory.types";

export function ProductHistoryTimeline() {
  const productId = useProductsStore((state) => state.productId);
  const { data, isLoading, isError, refetch, isFetching } = useProductHistory(productId);
  const [view, setView] = useState<HistoryView>("changes");
  const [selectedMetrics, setSelectedMetrics] = useState<PriceMetric[]>([...PRICE_METRICS]);
  const [range, setRange] = useState<TrendRange>("1y");

  const entries = data?.entries ?? [];
  const changes = buildPriceChanges(entries);
  const currentPrices = PRICE_METRICS.map((metric) => ({
    metric,
    value: getCurrentValue(changes, metric)
  }));

  const toggleMetric = (metric: PriceMetric) => {
    setSelectedMetrics((current) =>
      current.includes(metric)
        ? current.filter((selectedMetric) => selectedMetric !== metric)
        : PRICE_METRICS.filter(
            (availableMetric) => availableMetric === metric || current.includes(availableMetric)
          )
    );
  };

  if (!productId) return null;

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
        <LoaderCircle className="text-counter-accent size-5 animate-spin" aria-hidden="true" />
        Loading price history...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <ErrorState
          layout="panel"
          className="max-w-md"
          title="Price history could not be loaded"
          description="Your product information is unchanged. Try loading the history again."
          primaryAction={{
            label: "Try again",
            onClick: () => void refetch(),
            loading: isFetching
          }}
        />
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <span className="bg-secondary text-muted-foreground flex size-11 items-center justify-center rounded-(--radius-panel)">
          <Clock3 className="size-5" aria-hidden="true" />
        </span>
        <h3 className="text-foreground mt-3 text-base font-semibold">No price changes yet</h3>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          Selling price, purchase price, and MRP changes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      <ProductHistoryHeader
        changeCount={changes.length}
        currentPrices={currentPrices}
        view={view}
        onViewChange={setView}
      />
      <div className="min-h-0 flex-1 p-3">
        {view === "changes" ? (
          <ProductPriceChangesTable changes={changes} />
        ) : (
          <ProductPriceTrend
            changes={changes}
            selectedMetrics={selectedMetrics}
            onMetricToggle={toggleMetric}
            range={range}
            onRangeChange={setRange}
          />
        )}
      </div>
    </div>
  );
}
