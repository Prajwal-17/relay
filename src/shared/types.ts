export type UsersType = {
  id: string;
  name: string;
  role: string;
};

export type CustomersType = {
  id: string;
  name: string;
  contact: string | null;
  customerType: string;
  updatedAt?: string;
  createdAt?: string;
};

export type ProductsType = {
  id: string;
  name: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  totalQuantitySold: number | null;
  isDisabled?: boolean;
};

export type ProductHistoryType = {
  id: string;
  name: string;
  weight: string;
  unit: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  oldPurchasePrice: number;
  newPurchasePrice: number;
  oldMrp: number;
  newMrp: number;
};

export type SalesType = {
  id: string;
  invoiceNo: number;
  customerId: string | null;
  grandTotal: number | null;
  totalQuantity: number | null;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type EstimateType = {
  id: string;
  estimateNo: number;
  customerId: string | null;
  grandTotal: number | null;
  totalQuantity: number | null;
  isPaid: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SaleItemsType = {
  id: string;
  saleId: string;
  productId: string | null;
  name: string;
  mrp: number | null;
  price: number;
  purchasePrice: number | null;
  weight: string | null;
  unit: string | null;
  quantity: number;
  totalPrice: number;
  checkedQty: number;
};

export type EstimateItemsType = {
  id: string;
  estimateId: string;
  productId: string | null;
  name: string;
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
  items: SalePayloadItems[];
};

export type SalePayloadItems = {
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
  items: EstimatePayloadItems[];
};

export type EstimatePayloadItems = {
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

export type ProductPayload = Omit<ProductsType, "id"> & { isDisabled?: boolean };

export type FilteredGoogleContactsType = {
  id: number;
  name: string | null;
  contact: string | null;
};

export type SaleSummaryType = {
  totalRevenue: number;
  totalTransactions: number;
  sales: (SalesType & { customerName: string })[];
};

export type EstimateSummaryType = {
  totalRevenue: number;
  totalTransactions: number;
  estimates: (EstimateType & { customerName: string })[];
};

export type AllTransactionsType = (SalesType | EstimateType)[];

export type DateRangeType = {
  from: Date;
  to: Date;
};

export const TRANSACTION_TYPE = {
  SALES: "sales",
  ESTIMATES: "estimates"
} as const;

export const DASHBOARD_TYPE = TRANSACTION_TYPE;

export const PRODUCT_FILTER = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive"
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

export interface DashboardApi {
  getMetricsSummary: () => Promise<ApiResponse<MetricsSummary>>;
  getChartMetrics: (timePeriod: TimePeriodType) => Promise<ApiResponse<ChartDataType[]>>;
  getRecentTransactions: (
    type: TransactionType
  ) => Promise<
    ApiResponse<
      (SalesType & { customerName: string })[] | (EstimateType & { customerName: string })[] | []
    >
  >;
  getTopProducts: () => Promise<ApiResponse<TopProductDataPoint[]>>;
}

export interface ProductsApi {
  getAllProducts: () => Promise<ApiResponse<ProductsType[]>>;
  search: (
    query: string,
    pageNo: PageNo,
    limit: number,
    filterType?: ProductFilterType
  ) => Promise<PaginatedApiResponse<ProductsType[] | []>>;
  addNewProduct: (payload: ProductPayload) => Promise<ApiResponse<string>>;
  updateProduct: (
    productId: string,
    payload: Partial<ProductPayload>
  ) => Promise<ApiResponse<string>>;
  deleteProduct: (productId: string) => Promise<ApiResponse<string>>;
}

export interface SalesApi {
  getNextInvoiceNo: () => Promise<ApiResponse<number>>;
  save: (payload: SalePayload) => Promise<ApiResponse<{ id: string; type: TransactionType }>>;
  getAllSales: () => Promise<ApiResponse<SalesType[]>>;
  getTransactionById: (
    id: string
  ) => Promise<ApiResponse<SalesType & { customer: CustomersType; items: SaleItemsType[] }>>;
  getSalesDateRange: (
    range: DateRangeType,
    sortBy: SortType,
    pageNo: PageNo
  ) => Promise<PaginatedApiResponse<SaleSummaryType>>;
  deleteSale: (saleId: string) => Promise<ApiResponse<string>>;
  convertSaletoEstimate: (saleId: string) => Promise<ApiResponse<string>>;
  registerSaleItemQty: (
    saleItemId: string,
    action: UpdateQtyAction
  ) => Promise<ApiResponse<string>>;
  markAllSaleItemsChecked: (
    saleid: string,
    action: BatchCheckAction
  ) => Promise<ApiResponse<{ isAllChecked: boolean }>>;
}

export interface EstimatesApi {
  getNextEstimateNo: () => Promise<ApiResponse<number>>;
  save: (payload: EstimatePayload) => Promise<ApiResponse<{ id: string; type: TransactionType }>>;
  getAllEstimates: () => Promise<ApiResponse<EstimateType[]>>;
  getTransactionById: (
    id: string
  ) => Promise<ApiResponse<EstimateType & { customer: CustomersType; items: EstimateItemsType[] }>>;
  getEstimatesDateRange: (
    range: DateRangeType,
    sortBy: SortType,
    pageNo: PageNo
  ) => Promise<PaginatedApiResponse<EstimateSummaryType>>;
  deleteEstimate: (estimateId: string) => Promise<ApiResponse<string>>;
  convertEstimateToSale: (estimateId: string) => Promise<ApiResponse<string>>;
  registerEstimateItemQty: (
    estimateItemId: string,
    action: UpdateQtyAction
  ) => Promise<ApiResponse<string>>;
  markAllEstimateItemsChecked: (
    estimateId: string,
    action: BatchCheckAction
  ) => Promise<ApiResponse<{ isAllChecked: boolean }>>;
}

export interface CustomersApi {
  addNewCustomer: (payload: CustomersType) => Promise<ApiResponse<CustomersType>>;
  updateCustomer: (payload: CustomersType) => Promise<ApiResponse<CustomersType>>;
  getCustomerById: (customerId: string) => Promise<ApiResponse<CustomersType>>;
  getCustomerByName: (customerName: string) => Promise<ApiResponse<CustomersType | null>>;
  getAllCustomers: () => Promise<ApiResponse<CustomersType[]>>;
  getAllTransactionsById: (
    customerId: string,
    type: TransactionType,
    pageNo: PageNo
  ) => Promise<PaginatedApiResponse<SalesType[] | EstimateType[] | []>>;
  deleteCustomer: (customerId: string) => Promise<ApiResponse<string>>;
  importContactsFromGoogle: () => Promise<ApiResponse<FilteredGoogleContactsType[] | []>>;
  importContacts: (customerPayload: FilteredGoogleContactsType[]) => Promise<ApiResponse<string>>;
  searchCustomers: (query: string) => Promise<ApiResponse<CustomersType[]>>;
}

export interface ShareApi {
  saveAsPDF: (transactionId: string, type: "sales" | "estimates") => Promise<ApiResponse<string>>;
}
