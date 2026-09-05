import type { ProductHistoryEntry } from "@/features/products/hooks/useProductHistory";
import { IndianRupee, ShoppingBag, Tag, type LucideIcon } from "lucide-react";

import type { PriceMetric, TrendRange } from "./productHistory.types";

type PriceMetricConfig = {
  label: string;
  shortLabel: string;
  summaryLabel: string;
  icon: LucideIcon;
  color: string;
  strokeDasharray?: string;
  getOld: (entry: ProductHistoryEntry) => number | null;
  getNew: (entry: ProductHistoryEntry) => number | null;
};

export const PRICE_METRICS = ["selling", "purchase", "mrp"] as const satisfies PriceMetric[];

export const PRICE_METRIC_CONFIG: Record<PriceMetric, PriceMetricConfig> = {
  selling: {
    label: "Selling price",
    shortLabel: "Selling",
    summaryLabel: "Current selling price",
    icon: IndianRupee,
    color: "var(--chart-1)",
    getOld: (entry) => entry.oldPrice,
    getNew: (entry) => entry.newPrice
  },
  purchase: {
    label: "Purchase price",
    shortLabel: "Purchase",
    summaryLabel: "Current purchase price",
    icon: ShoppingBag,
    color: "var(--chart-3)",
    strokeDasharray: "7 4",
    getOld: (entry) => entry.oldPurchasePrice,
    getNew: (entry) => entry.newPurchasePrice
  },
  mrp: {
    label: "MRP",
    shortLabel: "MRP",
    summaryLabel: "Current MRP",
    icon: Tag,
    color: "var(--chart-5)",
    strokeDasharray: "2 4",
    getOld: (entry) => entry.oldMrp,
    getNew: (entry) => entry.newMrp
  }
};

export const PRICE_CHART_CONFIG = {
  selling: { label: "Selling price", color: "var(--chart-1)" },
  purchase: { label: "Purchase price", color: "var(--chart-3)" },
  mrp: { label: "MRP", color: "var(--chart-5)" }
};

export const TREND_RANGE_OPTIONS: ReadonlyArray<{
  value: TrendRange;
  label: string;
  days: number | null;
}> = [
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "3 months", days: 90 },
  { value: "180d", label: "6 months", days: 180 },
  { value: "1y", label: "1 year", days: 365 },
  { value: "all", label: "All time", days: null }
];
