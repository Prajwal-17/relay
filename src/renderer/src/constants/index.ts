import { SortOption, TIME_PERIOD } from "@shared/types";
import { BarChart3, Receipt, Users, Zap } from "lucide-react";

export const PRODUCT_NAME = "QuickCart";

// Onboarding
export const ONBOARDING_STEPS = 5;
export const ONBOARDING_FEATURES = [
  { icon: Zap, text: "100% offline — no internet needed" },
  { icon: BarChart3, text: "Track sales & reports" },
  { icon: Users, text: "Manage customer ledgers" },
  { icon: Receipt, text: "Create GST invoices in seconds" }
];
export const ONBOARDING_STEP_LABELS = ["Welcome", "Your Store", "Owner Info", "Location", "Ready!"];
export const FEATURE_PILLS = ["Fast Billing", "GST Ready", "Works Offline", "Customer Ledger"];

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
