import type z from "zod";
import type { createCustomerSchema } from "./schemas/customers.schema";
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

export type Customer = {
  id: string;
  name: string;
  contact: string | null;
  customerType: string;
  updatedAt?: string;
  createdAt?: string;
};

export type Product = {
  id: string;
  name: string;
  productSnapshot: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  totalQuantitySold: number | null;
  isDisabled?: boolean;
  disabledAt?: string;
  updatedAt?: string;
  createdAt?: string;
};

export type ProductWithDeletion = Product & {
  isDeleted?: boolean;
  deletedAt?: string | null;
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
  parentId: string;
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

export type PaginatedApiResponse<T> =
  | {
      status: "success";
      data: T;
      nextPageNo: PageNo;
      message?: string;
    }
  | {
      status: "error";
      error: {
        message: string;
        details?: any;
      };
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
export type UpdateCustomerPayload = z.infer<typeof updateProductSchema>;

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

export const SortOption = {
  DATE_NEWEST_FIRST: "date_newest_first",
  DATE_OLDEST_FIRST: "date_oldest_first",
  HIGH_TO_LOW: "high_to_low",
  LOW_TO_HIGH: "low_to_high"
  // STATUS_UNPAID: "status_unpaid",
  // STATUS_PAID: "status_paid"
} as const;

export type ProductFilterType = (typeof PRODUCT_FILTER)[keyof typeof PRODUCT_FILTER];

export type SortType = (typeof SortOption)[keyof typeof SortOption];

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

export type UpdateResponseItem = UnifiedTransactionItem & {
  rowId: string;
};

export type UpdateSaleResponse = Omit<UnifiedTransctionWithItems, "customer"> & {
  items: UpdateResponseItem[];
};

export const BILLSTATUS = {
  IDLE: "idle",
  SAVING: "saving",
  SAVED: "saved",
  UNSAVED: "unsaved",
  ERROR: "error"
} as const;

export type BillStatus = (typeof BILLSTATUS)[keyof typeof BILLSTATUS];

export interface DashboardApi {
  getMetricsSummary: () => Promise<ApiResponse<MetricsSummary>>;
  getChartMetrics: (timePeriod: TimePeriodType) => Promise<ApiResponse<ChartDataType[]>>;
  getRecentTransactions: (
    type: TransactionType
  ) => Promise<
    ApiResponse<(Sale & { customerName: string })[] | (Estimate & { customerName: string })[] | []>
  >;
  getTopProducts: () => Promise<ApiResponse<TopProductDataPoint[]>>;
}

export interface ShareApi {
  saveAsPDF: (transactionId: string, type: "sales" | "estimates") => Promise<ApiResponse<string>>;
}
