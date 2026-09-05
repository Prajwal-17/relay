import type { ProductHistoryEntry } from "@/features/products/hooks/useProductHistory";

import { PRICE_METRIC_CONFIG, PRICE_METRICS, TREND_RANGE_OPTIONS } from "./productHistory.config";
import type { PriceChange, PriceMetric, PriceTrendPoint, TrendRange } from "./productHistory.types";

export function buildPriceChanges(entries: ProductHistoryEntry[]): PriceChange[] {
  return entries.flatMap((entry, entryIndex) =>
    PRICE_METRICS.flatMap((metric) => {
      const config = PRICE_METRIC_CONFIG[metric];
      const oldValue = config.getOld(entry);
      const newValue = config.getNew(entry);

      if ((oldValue === null && newValue === null) || oldValue === newValue) return [];

      return [
        {
          id: `${entry.createdAt}-${metric}-${entryIndex}`,
          createdAt: entry.createdAt,
          metric,
          label: config.label,
          oldValue,
          newValue
        }
      ];
    })
  );
}

export function getCurrentValue(changes: PriceChange[], metric: PriceMetric) {
  let latestChange: PriceChange | undefined;

  for (const change of changes) {
    if (change.metric !== metric) continue;
    if (!latestChange || Date.parse(change.createdAt) > Date.parse(latestChange.createdAt)) {
      latestChange = change;
    }
  }

  return latestChange?.newValue ?? null;
}

export function buildTrendPoints(changes: PriceChange[]): PriceTrendPoint[] {
  const currentValues: Record<PriceMetric, number | null> = {
    selling: null,
    purchase: null,
    mrp: null
  };
  const pointsByTimestamp = new Map<string, PriceTrendPoint>();
  const chronologicalChanges = [...changes].sort(
    (left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)
  );

  for (const change of chronologicalChanges) {
    currentValues[change.metric] = change.newValue;
    const existingPoint = pointsByTimestamp.get(change.createdAt);

    if (existingPoint) {
      existingPoint[change.metric] = change.newValue;
    } else {
      pointsByTimestamp.set(change.createdAt, {
        createdAt: change.createdAt,
        ...currentValues
      });
    }
  }

  return [...pointsByTimestamp.values()];
}

export function filterTrendPoints(points: PriceTrendPoint[], range: TrendRange) {
  const days = TREND_RANGE_OPTIONS.find((option) => option.value === range)?.days ?? null;
  if (days === null || points.length === 0) return points;

  const latestTimestamp = Date.parse(points[points.length - 1]!.createdAt);
  const cutoffTimestamp = latestTimestamp - days * 24 * 60 * 60 * 1000;
  return points.filter((point) => Date.parse(point.createdAt) >= cutoffTimestamp);
}

export function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Kolkata"
  });
}

export function formatCompactRupee(valueInPaisa: number) {
  const rupees = valueInPaisa / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: Math.abs(rupees) >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 0
  }).format(rupees);
}
