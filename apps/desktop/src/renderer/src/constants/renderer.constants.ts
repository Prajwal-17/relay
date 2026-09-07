import {
  CUSTOMER_SORT_BY,
  CUSTOMER_TXN_SORT,
  LEDGER_SORT,
  LEDGER_TYPE_FILTER,
  PRODUCT_FILTER,
  PRODUCT_SORT_BY,
  TIME_PERIOD
} from "@shared/types";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  BarChart3,
  CalendarArrowDown,
  CalendarArrowUp,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";

export { PRODUCT_NAME } from "@shared/constants";

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

// Customers Page
export const CUSTOMERS_SEARCH_DELAY = 300;
export const CUSTOMERS_PAGE_SIZE = 20;
export const CUSTOMER_SORT_OPTIONS = [
  { value: CUSTOMER_SORT_BY.NAME_ASC, label: "Name: A → Z", icon: ArrowDownAZ },
  { value: CUSTOMER_SORT_BY.NAME_DESC, label: "Name: Z → A", icon: ArrowUpAZ },
  { value: CUSTOMER_SORT_BY.NEWEST, label: "Newest first", icon: CalendarArrowDown },
  { value: CUSTOMER_SORT_BY.OLDEST, label: "Oldest first", icon: CalendarArrowUp }
] as const;
// Customer Transaction Table
export const TXN_TABLE_PAGE_SIZE = 10;
export const TXN_TABLE_SEARCH_DEBOUNCE_MS = 400;
export const TXN_TABLE_SORT_OPTIONS = [
  { value: CUSTOMER_TXN_SORT.DATE_DESC, label: "Date: newest" },
  { value: CUSTOMER_TXN_SORT.DATE_ASC, label: "Date: oldest" },
  { value: CUSTOMER_TXN_SORT.AMOUNT_DESC, label: "Amount: high to low" },
  { value: CUSTOMER_TXN_SORT.AMOUNT_ASC, label: "Amount: low to high" }
] as const;

// Customer Ledger Table
export const LEDGER_TABLE_PAGE_SIZE = 10;
export const LEDGER_TABLE_SEARCH_DEBOUNCE_MS = 400;
export const LEDGER_SORT_OPTIONS = [
  { value: LEDGER_SORT.DATE_DESC, label: "Newest first" },
  { value: LEDGER_SORT.DATE_ASC, label: "Oldest first" }
] as const;

export const LEDGER_TYPE_OPTIONS = [
  { value: LEDGER_TYPE_FILTER.ALL, label: "All" },
  { value: LEDGER_TYPE_FILTER.SALE, label: "Sales" },
  { value: LEDGER_TYPE_FILTER.QUICK_SALE, label: "Quick Sales" },
  { value: LEDGER_TYPE_FILTER.PAYMENT, label: "Payments" },
  { value: LEDGER_TYPE_FILTER.ADJUSTMENT, label: "Adjustments" },
  { value: LEDGER_TYPE_FILTER.OPENING_BALANCE, label: "Opening" }
] as const;

// Products Page
export const PRODUCTS_SEARCH_DELAY = 400;
export const PRODUCTS_SEARCH_PAGE_SIZE = 20;
export const PRODUCT_SORT_OPTIONS = [
  { value: PRODUCT_SORT_BY.NAME_ASC, label: "Name: A → Z", icon: ArrowDownAZ },
  { value: PRODUCT_SORT_BY.NAME_DESC, label: "Name: Z → A", icon: ArrowUpAZ },
  { value: PRODUCT_SORT_BY.PRICE_LOW_HIGH, label: "Price: Low → High", icon: TrendingUp },
  { value: PRODUCT_SORT_BY.PRICE_HIGH_LOW, label: "Price: High → Low", icon: TrendingDown }
] as const;
export const PRODUCT_STATUS_OPTIONS = [
  { value: PRODUCT_FILTER.ACTIVE, label: "Active" },
  { value: PRODUCT_FILTER.INACTIVE, label: "Inactive" },
  { value: PRODUCT_FILTER.ALL, label: "All" },
  { value: PRODUCT_FILTER.DELETED, label: "Deleted" }
] as const;
export const PRODUCT_IMAGE_PROTOCOL = "app-assets://product-images/";

export const getProductImageUrl = (imageId: string) =>
  `${PRODUCT_IMAGE_PROTOCOL}${encodeURIComponent(imageId)}`;

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
