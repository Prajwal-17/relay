export type UsersType = {
  id: string;
  name: string;
  role: string;
};

export type CustomersType = {
  id: string;
  name: string;
  contact: string;
  customerType: string;
};

export type ProductsType = {
  id: string;
  name: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: number;
};

export type ProductHistoryType = {
  id: string;
  name: string;
  weight: string;
  unit: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  oldMrp: number;
  newMrp: number;
};

export type SalesType = {
  id: string;
  invoiceNo: number;
  customerId: string | null;
  customerName: string;
  customerContact: string | null;
  grandTotal: number | null;
  totalQuantity: number | null;
  isPaid: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type EstimateType = {
  id: string;
  estimateNo: number;
  customerId: string | null;
  customerName: string;
  customerContact: string | null;
  grandTotal: number | null;
  totalQuantity: number | null;
  isPaid: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type SaleItemsType = {
  id: string;
  saleId: string;
  productId: string | null;
  name: string;
  mrp: number | null;
  price: number;
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
  weight: string | null;
  unit: string | null;
  quantity: number;
  totalPrice: number;
};

export type ApiResponse<T> =
  | {
      status: "success";
      data: T;
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
  customerName: string;
  customerContact: string | null;
  grandTotal: number;
  totalQuantity: number | null;
  isPaid: boolean;
  items: SalePayloadItems[];
};

export type SalePayloadItems = {
  id: string;
  productId: string;
  name: string;
  mrp: number | null;
  price: number;
  weight: string | null;
  unit: string | null;
  quantity: number;
  totalPrice: number;
};

export type EstimatePayload = {
  billingId: string | null;
  estimateNo: number;
  customerName: string;
  customerContact: string | null;
  grandTotal: number;
  totalQuantity: number | null;
  isPaid: boolean;
  items: EstimatePayloadItems[];
};

export type EstimatePayloadItems = {
  id: string;
  productId: string;
  name: string;
  mrp: number | null;
  price: number;
  weight: string | null;
  unit: string | null;
  quantity: number;
  totalPrice: number;
};

export interface ProductsApi {
  getAllProducts: () => Promise<ApiResponse<ProductsType[]>>;
  search: (query: string, page: number, limit: number) => Promise<ApiResponse<ProductsType[]>>;
}

export interface SalesApi {
  getNextInvoiceNo: () => Promise<ApiResponse<number>>;
  save: (payload: SalePayload) => Promise<ApiResponse<string>>;
  getAllSales: () => Promise<ApiResponse<SalesType[]>>;
  getTransactionById: (id: string) => Promise<ApiResponse<SalesType & { items: SaleItemsType[] }>>;
}

export interface EstimatesApi {
  getNextEstimateNo: () => Promise<ApiResponse<number>>;
  save: (payload: EstimatePayload) => Promise<ApiResponse<string>>;
  getAllEstimates: () => Promise<ApiResponse<EstimateType[]>>;
  getTransactionById: (
    id: string
  ) => Promise<ApiResponse<EstimateType & { items: EstimateItemsType[] }>>;
}
