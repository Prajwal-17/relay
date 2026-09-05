export type HistoryView = "changes" | "trend";
export type PriceMetric = "selling" | "purchase" | "mrp";
export type TrendRange = "30d" | "90d" | "180d" | "1y" | "all";

export type PriceChange = {
  id: string;
  createdAt: string;
  metric: PriceMetric;
  label: string;
  oldValue: number | null;
  newValue: number | null;
};

export type PriceTrendPoint = {
  createdAt: string;
  selling: number | null;
  purchase: number | null;
  mrp: number | null;
};
