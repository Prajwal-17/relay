// types used globally for both frontend & api service
import type z from "zod";
import type { createCustomerSchema, updateCustomerSchema } from "./schemas/customers.schema";
import type { createProductSchema, updateProductSchema } from "./schemas/products.schema";
import type {
  lineItemSchema,
  payloadDataSchema,
  txnPayloadSchema
} from "./schemas/transaction.schema";

export type UsersType = {
  id: string;
  name: string;
  role: string;
};

// TODO: add new fields
export type Customer = {
  id: string;
  name: string;
  contact: string | null;
  customerType: string;
  notes: string | null;
  address: string | null;
  outstandingBalance: number | null; // TODO: rm null
  creditLimit: number | null; // TODO: rm null
  updatedAt?: string;
  createdAt?: string;
};

export type Product = {
  id: string;
  name: string;
  imageUrl?: string | null;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  totalQuantitySold: number | null;
  isDisabled?: boolean;
  disabledAt?: string | null;
  lastSoldAt?: string | null;
  updatedAt?: string;
  createdAt?: string;
};

export type ProductSearchItemDTO = Product & {
  isDeleted?: boolean;
  deletedAt?: string | null;
};

export type BillingProductDTO = {
  id: string;
  name: string;
  imageUrl?: string | null;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  updatedAt?: string;
  createdAt?: string;
};

export type ProductHistory = {
  id: string;
  name: string;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  productId: string;
  oldPrice: number;
  newPrice: number;
  oldPurchasePrice: number;
  newPurchasePrice: number;
  oldMrp: number;
  newMrp: number;
};

export type ProductTransaction = {
  type: TransactionType;
  transactionNo: number;
  customerName: string;
  quantity: number;
  price: number;
  totalPrice: number;
  isPaid: boolean;
  createdAt: string;
};

export type UnifiedTransaction = {
  type: TransactionType;
  id: string;
  transactionNo: number;
  customerId: string | null;
  customer: Customer;
  grandTotal: number | null;
  totalQuantity: number | null;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UnifiedTransactionItem = {
  id: string;
  productId: string | null;
  name: string;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  price: number;
  mrp: number | null;
  quantity: number;
  totalPrice: number;
  purchasePrice: number | null;
  checkedQty: number;
};

export type UnifiedTransctionWithItems = UnifiedTransaction & {
  items: UnifiedTransactionItem[];
};

export type CustomerTransaction = Omit<UnifiedTransaction, "customer">;

export type Sale = {
  id: string;
  invoiceNo: number;
  customerId: string | null;
  grandTotal: number | null;
  totalQuantity: number | null;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Estimate = {
  id: string;
  estimateNo: number;
  customerId: string | null;
  grandTotal: number | null;
  totalQuantity: number | null;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SaleItem = {
  id: string;
  saleId: string;
  productId: string | null;
  name: string;
  productSnapshot: string;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  weight: string | null;
  unit: string | null;
  quantity: number;
  totalPrice: number;
  checkedQty: number;
};

export type EstimateItem = {
  id: string;
  estimateId: string;
  productId: string | null;
  name: string;
  productSnapshot: string;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  weight: string | null;
  unit: string | null;
  quantity: number;
  totalPrice: number;
  checkedQty: number;
};

export type PageNo = number | null;

export type ApiResponse<T> =
  | {
      status: "success";
      data: T;
      message?: string;
    }
  | {
      status: "error";
      error: {
        message: string;
        details?: any;
      };
    };

export type PaginatedApiResponse<T> = {
  nextPageNo: PageNo;
  totalCount?: number;
} & T;

export type CustomerSummary = {
  salesCount: number;
  estimatesCount: number;
  salesTotal: number;
  estimatesTotal: number;
  average: number;
};

export type SalePayload = {
  billingId: string | null;
  invoiceNo: number;
  customerId: string | null;
  customerName: string;
  customerContact: string | null;
  grandTotal: number;
  totalQuantity: number | null;
  isPaid: boolean;
  createdAt?: string;
  items: SalePayloadItem[];
};

export type SalePayloadItem = {
  id: string;
  productId: string;
  name: string;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  weight: string | null;
  unit: string | null;
  quantity: number;
  totalPrice: number;
};

export type EstimatePayload = {
  billingId: string | null;
  estimateNo: number;
  customerId: string | null;
  customerName: string;
  customerContact: string | null;
  grandTotal: number;
  totalQuantity: number | null;
  isPaid: boolean;
  createdAt: string;
  items: EstimatePayloadItem[];
};

export type EstimatePayloadItem = {
  id: string;
  productId: string;
  name: string;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  weight: string | null;
  unit: string | null;
  quantity: number;
  totalPrice: number;
};

export type CreateCustomerPayload = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerPayload = z.infer<typeof updateCustomerSchema>;

export type CreateProductPayload = z.infer<typeof createProductSchema>;
export type UpdateProductPayload = z.infer<typeof updateProductSchema>;

export type TxnPayload = z.infer<typeof txnPayloadSchema>;
export type TxnPayloadData = z.infer<typeof payloadDataSchema>;
export type LineItemSchema = z.infer<typeof lineItemSchema>;

export type FilteredGoogleContactsType = {
  id: number;
  name: string | null;
  contact: string | null;
};

export type TransactionListResponse = {
  totalRevenue: number;
  totalTransactions: number;
  transactions: (Omit<UnifiedTransaction, "customer"> & { customerName: string })[];
};

export type AllTransactionsType = (Sale | Estimate)[];

export type DateRangeType = {
  from: Date;
  to: Date;
};

export const TRANSACTION_TYPE = {
  SALE: "sale",
  ESTIMATE: "estimate"
} as const;

export const DASHBOARD_TYPE = {
  SALES: "sales",
  ESTIMATES: "estimates"
} as const;

export const PRODUCT_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted"
} as const;

export const CUSTOMER_TYPE = {
  ALL: "all",
  CASH: "cash",
  ACCOUNT: "account",
  HOTEL: "hotel"
} as const;

export const SortOption = {
  DATE_NEWEST_FIRST: "date_newest_first",
  DATE_OLDEST_FIRST: "date_oldest_first",
  HIGH_TO_LOW: "high_to_low",
  LOW_TO_HIGH: "low_to_high"
} as const;

export const PRODUCT_SORT_BY = {
  NAME_ASC: "name_asc",
  NAME_DESC: "name_desc",
  PRICE_LOW_HIGH: "price_low_high",
  PRICE_HIGH_LOW: "price_high_low",
  MRP_LOW_HIGH: "mrp_low_high",
  MRP_HIGH_LOW: "mrp_high_low"
} as const;

export const CUSTOMER_SORT_BY = {
  NAME_ASC: "name_asc",
  NAME_DESC: "name_desc",
  NEWEST: "newest",
  OLDEST: "oldest"
} as const;

export const CUSTOMER_TXN_SORT = {
  DATE_DESC: "date_desc",
  DATE_ASC: "date_asc",
  AMOUNT_DESC: "amount_desc",
  AMOUNT_ASC: "amount_asc"
} as const;

export const CUSTOMER_TXN_STATUS = {
  ALL: "all",
  PAID: "paid",
  UNPAID: "unpaid"
} as const;

export const LEDGER_ENTRY_TYPE = {
  SALE: "sale",
  QUICK_SALE: "quick_sale",
  PAYMENT: "payment",
  ADJUSTMENT: "adjustment",
  OPENING_BALANCE: "opening_balance"
} as const;

export type LedgerEntryType = (typeof LEDGER_ENTRY_TYPE)[keyof typeof LEDGER_ENTRY_TYPE];

export const LEDGER_TYPE_FILTER = {
  ALL: "all",
  ...LEDGER_ENTRY_TYPE
} as const;

export type LedgerTypeFilter = (typeof LEDGER_TYPE_FILTER)[keyof typeof LEDGER_TYPE_FILTER];

export const LEDGER_SORT = {
  DATE_DESC: "date_desc",
  DATE_ASC: "date_asc"
} as const;

export type LedgerSort = (typeof LEDGER_SORT)[keyof typeof LEDGER_SORT];

export const PAYMENT_MODE = {
  CASH: "cash",
  UPI: "upi",
  CARD: "card"
} as const;

export type PaymentMode = (typeof PAYMENT_MODE)[keyof typeof PAYMENT_MODE];

export type LedgerEntry = {
  id: string;
  customerId: string;
  type: LedgerEntryType;
  saleId: string | null;
  invoiceNo: number | null;
  debit: number;
  credit: number;
  paymentMode: string | null;
  notes: string | null;
  runningBalance: number;
  createdAt: string;
};

export type LedgerSummary = {
  currentBalance: number;
  totalDebit: number;
  totalCredit: number;
  openingBalance: number;
  avgSale: number;
  salesCount: number;
  lastPayment: { amount: number; mode: string; date: string } | null;
};

export type CreatePaymentPayload = {
  amount: number;
  mode: PaymentMode;
  notes?: string;
};

export type CreateAdjustmentPayload = {
  amount: number;
  direction: "debit" | "credit";
  notes?: string;
};

export type CreateQuickSalePayload = {
  amount: number;
  notes?: string;
};

export type CreateOpeningBalancePayload = {
  amount: number;
  notes?: string;
};

export const PROPERTY_FILTER = {
  HAS_MRP: "hasMrp",
  HAS_PURCHASE_PRICE: "hasPurchasePrice"
} as const;

export type ProductFilterType = (typeof PRODUCT_FILTER)[keyof typeof PRODUCT_FILTER];

export type CustomerType = (typeof CUSTOMER_TYPE)[keyof typeof CUSTOMER_TYPE];

export type SortType = (typeof SortOption)[keyof typeof SortOption];

export type ProductSortByType = (typeof PRODUCT_SORT_BY)[keyof typeof PRODUCT_SORT_BY];

export type CustomerSortByType = (typeof CUSTOMER_SORT_BY)[keyof typeof CUSTOMER_SORT_BY];

export type CustomerTxnSort = (typeof CUSTOMER_TXN_SORT)[keyof typeof CUSTOMER_TXN_SORT];

export type CustomerTxnStatus = (typeof CUSTOMER_TXN_STATUS)[keyof typeof CUSTOMER_TXN_STATUS];

export type PropertyFilterType = (typeof PROPERTY_FILTER)[keyof typeof PROPERTY_FILTER];

export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

export type DashboardType = (typeof DASHBOARD_TYPE)[keyof typeof DASHBOARD_TYPE];

export const TREND_OPTION = {
  INCREASE: "increase",
  DECREASE: "decrease",
  NO_CHANGE: "no change"
} as const;

export type TrendType = (typeof TREND_OPTION)[keyof typeof TREND_OPTION];

export type MetricsSummary = {
  counts: {
    customers: number;
    products: number;
    sales: number;
    estimates: number;
  };
  sales: {
    today: number;
    yesterday: number;
    changePercent: number;
    trend: TrendType;
  };
  estimates: {
    today: number;
    yesterday: number;
    changePercent: number;
    trend: TrendType;
  };
};

export const TIME_PERIOD = {
  THIS_YEAR: "this_year",
  THIS_WEEK: "this_week",
  LAST_7_DAYS: "last_7_days"
};

export type TimePeriodType = (typeof TIME_PERIOD)[keyof typeof TIME_PERIOD];

export type ChartDataType = {
  label: string;
  sales: number;
  estimates: number;
};

export type TopProductDataPoint = {
  id: string;
  name: string;
  totalQuantitySold: number;
  sharePercent: number;
};

export type RecentTransactions =
  | (Sale & { customerName: string })[]
  | (Estimate & { customerName: string })[];

export const UPDATE_QTY_ACTION = {
  SET: "set",
  INCREMENT: "inc",
  DECREMENT: "dec"
} as const;

export type UpdateQtyAction = (typeof UPDATE_QTY_ACTION)[keyof typeof UPDATE_QTY_ACTION];

export const BATCH_CHECK_ACTION = {
  MARK_ALL: "mark_all",
  UNMARK_ALL: "unmark_all"
} as const;

export type BatchCheckAction = (typeof BATCH_CHECK_ACTION)[keyof typeof BATCH_CHECK_ACTION];

export type SyncedItems = {
  rowId: string;
  id: string;
  updatedAt: string;
};

export type SyncResponse = {
  billingId?: string;
  transactionNo?: number;
  syncedItems: SyncedItems[];
  deletedRowIds: string[];
};

export const BILLSTATUS = {
  IDLE: "idle",
  SAVING: "saving",
  SAVED: "saved",
  UNSAVED: "unsaved",
  ERROR: "error"
} as const;

export type BillStatus = (typeof BILLSTATUS)[keyof typeof BILLSTATUS];

// products page types - dialog mode, initial tab, action type, operation type
export const DIALOG_MODE = {
  VIEW: "view",
  EDIT: "edit"
} as const;

export type DialogMode = (typeof DIALOG_MODE)[keyof typeof DIALOG_MODE];

export const INITIAL_TAB = {
  INFO: "info",
  HISTORY: "history",
  TRANSACTIONS: "transactions"
} as const;

export type InitialTab = (typeof INITIAL_TAB)[keyof typeof INITIAL_TAB];

export const ACTION_TYPE = {
  ADD: "add",
  EDIT: "edit",
  BILLING_PAGE_EDIT: "billing-page-edit"
} as const;

export type ActionType = (typeof ACTION_TYPE)[keyof typeof ACTION_TYPE];

export const PRODUCT_OPERATION = {
  SOFT_DELETE: "soft-delete",
  PERMANENT_DELETE: "permanent-delete",
  RESTORE: "restore",
  IDLE: "idle"
} as const;

export type ProductOperation = (typeof PRODUCT_OPERATION)[keyof typeof PRODUCT_OPERATION];

export interface AppConfig {
  billing: {
    defaultCustomerId: string;
  };
  exports: {
    askBeforeSavingPdf: boolean;
    defaultPdfLocation: string;
    defaultExportFormat: string;
  };
}

export type AppPreferencesResponse = {
  id: string;
  storeId: string;
  config: AppConfig;
};

export type StoreProfile = {
  id: string;
  storeName: string;
  ownerName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string | null;
  country: string;
  state: string;
  pincode: string;
  city: string;
  gstin: string | null;
  createdAt: string;
  updatedAt: string;
};
// ------------

export interface ProductsApi {
  saveProductImage: (dataUrl: string) => Promise<ApiResponse<{ url: string }>>;
}

export interface DialogApi {
  selectFolder: () => Promise<string | null>;
}

export interface ExportApi {
  exportAsPdf: (id: string, type: TransactionType) => Promise<string | null>;
  showItemInFolder: (path: string) => void;
}
