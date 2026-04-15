import { PRODUCT_FILTER, SortOption, TIME_PERIOD } from "@shared/types";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  BarChart3,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";

export const PRODUCT_NAME = "QuickCart";

// Onboarding
export const ONBOARDING_STEPS = 5;
export const ONBOARDING_FEATURES = [
  { icon: Zap, text: "100% offline — no internet needed" },
  { icon: BarChart3, text: "Track sales & reports" },
  { icon: Users, text: "Manage customer ledgers" },
  { icon: Receipt, text: "Create invoices in seconds" }
];
export const ONBOARDING_STEP_LABELS = ["Welcome", "Your Store", "Owner Info", "Location", "Ready!"];
export const FEATURE_PILLS = ["Fast Billing", "Works Offline", "Customer Ledger"];

export const MAX_PRESET_COUNT = 40;

export const PRODUCT_UNITS = ["g", "kg", "ml", "l", "pc", "none"];

export const SEARCH_DROPDOWN_DELAY = 150;

export const SEARCH_DROPDOWN_ITEMS_LIMIT = 20;

// Default value to set hour on new date.
export const DEFAULT_HOUR = 8;

export const PRODUCTS_LIMIT = 20;

export const ignoredWeight = ["", "1ml", "1g", "none", "1pc", "1kg"];

// Products Page
export const PRODUCTS_SEARCH_DELAY = 400;
export const PRODUCTS_SEARCH_PAGE_SIZE = 20;
export const PRODUCT_SORT_OPTIONS = [
  { value: "name_asc", label: "Name: A → Z", icon: ArrowDownAZ },
  { value: "name_desc", label: "Name: Z → A", icon: ArrowUpAZ },
  { value: "price_low_high", label: "Price: Low → High", icon: TrendingUp },
  { value: "price_high_low", label: "Price: High → Low", icon: TrendingDown }
] as const;
export const PRODUCT_STATUS_OPTIONS = [
  { value: PRODUCT_FILTER.ACTIVE, label: "Active" },
  { value: PRODUCT_FILTER.INACTIVE, label: "Inactive" },
  { value: PRODUCT_FILTER.ALL, label: "All" },
  { value: PRODUCT_FILTER.DELETED, label: "Deleted" }
] as const;

export const weights = [
  {
    label: "50g",
    weight: "0.050"
  },
  {
    label: "100g",
    weight: "0.100"
  },
  {
    label: "250g",
    weight: "0.250"
  },
  {
    label: "500g",
    weight: "0.500"
  },
  {
    label: "750g",
    weight: "0.750"
  }
];

export const sortOptions = [
  {
    value: SortOption.DATE_NEWEST_FIRST,
    label: "Date (Newest first)"
  },
  {
    value: SortOption.DATE_OLDEST_FIRST,
    label: "Date (Oldest first)"
  },
  {
    value: SortOption.HIGH_TO_LOW,
    label: "Amount (High to Low)"
  },
  {
    value: SortOption.LOW_TO_HIGH,
    label: "Amount (Low to High)"
  }
];

export const timePeriodOptions = [
  {
    value: TIME_PERIOD.THIS_YEAR,
    label: "This Year"
  },
  {
    value: TIME_PERIOD.THIS_WEEK,
    label: "This Week"
  },
  {
    value: TIME_PERIOD.LAST_7_DAYS,
    label: "Last 7 Days"
  }
];
