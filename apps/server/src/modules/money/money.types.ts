export type LocalDate = string;

export type PaymentMethod = {
  id: number;
  name: string;
  isPreset: boolean;
  isArchived: boolean;
};

export type DailyPaymentTotal = {
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  isPaymentMethodArchived: boolean;
};

export type VendorPayment = {
  id: number;
  vendorName: string;
  amount: number;
  note: string | null;
  createdAt: string;
};

export type DailyEntry = {
  date: LocalDate;
  cashAmount: number;
  paymentTotals: DailyPaymentTotal[];
  vendorPayments: VendorPayment[];
  createdAt: string;
  updatedAt: string;
};

export type DaySummary = {
  date: LocalDate;
  cashAmount: number;
  onlineAmount: number;
  receivedAmount: number;
  paidAmount: number;
  netAmount: number;
};

export type ReceivedEntry = {
  id: number;
  amount: number;
  note: string | null;
  createdAt: string;
};
