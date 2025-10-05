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
  totalQuantitySold?: number | null;
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

export type ProductPayload = ProductsType & { isDisabled?: boolean };

export type FilteredGoogleContactsType = {
  id: number;
  name: string | null;
  contact: string | null;
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

export const SortOption = {
  DATE_NEWEST_FIRST: "date_newest_first",
  DATE_OLDEST_FIRST: "date_oldest_first",
  HIGH_TO_LOW: "high_to_low",
  LOW_TO_HIGH: "low_to_high"
  // STATUS_UNPAID: "status_unpaid",
  // STATUS_PAID: "status_paid"
} as const;

export type SortType = (typeof SortOption)[keyof typeof SortOption];

export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

export type FilterType = "all" | "active" | "inactive";

export interface ProductsApi {
  getAllProducts: () => Promise<ApiResponse<ProductsType[]>>;
  search: (
    query: string,
    pageNo: PageNo,
    limit: number
  ) => Promise<PaginatedApiResponse<ProductsType[] | []>>;
  addNewProduct: (payload: Omit<ProductsType, "id">) => Promise<ApiResponse<string>>;
  updateProduct: (payload: ProductPayload, productId: string) => Promise<ApiResponse<string>>;
  deleteProduct: (productId: string) => Promise<ApiResponse<string>>;
}

export interface SalesApi {
  getNextInvoiceNo: () => Promise<ApiResponse<number>>;
  save: (payload: SalePayload) => Promise<ApiResponse<{ id: string; type: TransactionType }>>;
  getAllSales: () => Promise<ApiResponse<SalesType[]>>;
  getTransactionById: (id: string) => Promise<ApiResponse<SalesType & { items: SaleItemsType[] }>>;
  getSalesDateRange: (
    range: DateRangeType,
    sortBy: SortType,
    pageNo: PageNo
  ) => Promise<PaginatedApiResponse<SalesType[] | []>>;
  deleteSale: (saleId: string) => Promise<ApiResponse<string>>;
  convertSaletoEstimate: (saleId: string) => Promise<ApiResponse<string>>;
}

export interface EstimatesApi {
  getNextEstimateNo: () => Promise<ApiResponse<number>>;
  save: (payload: EstimatePayload) => Promise<ApiResponse<{ id: string; type: TransactionType }>>;
  getAllEstimates: () => Promise<ApiResponse<EstimateType[]>>;
  getTransactionById: (
    id: string
  ) => Promise<ApiResponse<EstimateType & { items: EstimateItemsType[] }>>;
  getEstimatesDateRange: (
    range: DateRangeType,
    sortBy: SortType
  ) => Promise<ApiResponse<EstimateType[] | []>>;
  deleteEstimate: (estimateId: string) => Promise<ApiResponse<string>>;
  convertEstimateToSale: (estimateId: string) => Promise<ApiResponse<string>>;
}

export interface CustomersApi {
  addNewCustomer: (payload: CustomersType) => Promise<ApiResponse<string>>;
  updateCustomer: (payload: CustomersType) => Promise<ApiResponse<CustomersType>>;
  getCustomerById: (customerId: string) => Promise<ApiResponse<CustomersType>>;
  getCustomerByName: (customerName: string) => Promise<ApiResponse<CustomersType | null>>;
  getAllCustomers: () => Promise<ApiResponse<CustomersType[]>>;
  getAllTransactionsById: (customerId: string) => Promise<ApiResponse<any>>;
  deleteCustomer: (customerId: string) => Promise<ApiResponse<string>>;
  importContactsFromGoogle: () => Promise<ApiResponse<FilteredGoogleContactsType[] | []>>;
  importContacts: (customerPayload: FilteredGoogleContactsType[]) => Promise<ApiResponse<string>>;
  searchCustomers: (query: string) => Promise<ApiResponse<CustomersType[]>>;
}

export interface ShareApi {
  sendViaWhatsapp: (
    type: "sales" | "estimates",
    transactionId: string
  ) => Promise<ApiResponse<string>>;
}
