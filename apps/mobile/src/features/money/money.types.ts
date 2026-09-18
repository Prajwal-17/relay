import type { LocalDate } from "@/types/date.types";

export type { LocalDate } from "@/types/date.types";

export interface PaymentMethod {
  id: number;
  name: string;
  isPreset: boolean;
  isArchived: boolean;
}

export interface DailyPaymentTotal {
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  isPaymentMethodArchived: boolean;
}

export interface VendorPayment {
  id: number;
  vendorName: string;
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface DailyEntry {
  date: LocalDate;
  cashAmount: number;
  paymentTotals: DailyPaymentTotal[];
  vendorPayments: VendorPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface DaySummary {
  date: LocalDate;
  cashAmount: number;
  onlineAmount: number;
  receivedAmount: number;
  paidAmount: number;
  netAmount: number;
}

export interface ReceivedEntry {
  id: number;
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface MoneyOverview {
  summaries: DaySummary[];
  entry: DailyEntry | null;
  paymentMethods: PaymentMethod[];
}

export interface ReceivedPaymentInput {
  date: LocalDate;
  paymentMethodId: number | null;
  amount: number;
  note?: string;
}

export interface VendorPaymentInput {
  date: LocalDate;
  vendorName: string;
  amount: number;
  note?: string;
}

export interface PaymentMethodUpdate {
  name?: string;
  isArchived?: boolean;
}
