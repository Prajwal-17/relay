import type {
  ActivityEvent,
  AttachmentMock,
  CustomerMock,
  EstimateMock,
  NoteMock,
  SaleMock
} from "./types";

/**
 * Mock customers. Mix of cash/account/hotel, varied outstanding signs.
 * One "hero" customer (acct-1001) carries the rich fixtures below.
 * `cust-sparse` is an empty-state fixture.
 *
 * All money in paisa.
 */
export const mockCustomers: CustomerMock[] = [
  {
    id: "acct-1001",
    name: "Sri Balaji Enterprises",
    contact: "+91 98765 43210",
    customerType: "account",
    gstin: "29ABCDE1234F1Z5",
    billingAddress: "No. 42, Commercial Street, Shivajinagar, Bengaluru, KA 560001",
    shippingAddress: "Warehouse 7, Peenya Industrial Area, Phase 2, Bengaluru, KA 560058",
    openingBalance: 500000,
    creditLimit: 2000000,
    outstanding: 1845000,
    totalSales: 8740000,
    lastPurchase: "2026-07-04T06:30:00Z",
    createdAt: "2024-03-12T04:00:00Z",
    updatedAt: "2026-07-04T06:30:00Z",
    tags: ["wholesale", "GST", "loyal"]
  },
  {
    id: "acct-1002",
    name: "Green Leaf Hotels Pvt Ltd",
    contact: "+91 90080 11223",
    customerType: "hotel",
    gstin: "29XYZAB5678L1Z2",
    billingAddress: "Residency Road, Ashok Nagar, Bengaluru, KA 560025",
    openingBalance: 0,
    creditLimit: 5000000,
    outstanding: -120000,
    totalSales: 12450000,
    lastPurchase: "2026-07-06T09:10:00Z",
    createdAt: "2023-11-02T04:00:00Z",
    tags: ["hotel", "GST", "bulk"]
  },
  {
    id: "acct-1003",
    name: "Ramesh Kirana Store",
    contact: "+91 94481 55667",
    customerType: "account",
    openingBalance: 25000,
    creditLimit: 100000,
    outstanding: 47250,
    totalSales: 980000,
    lastPurchase: "2026-07-01T11:45:00Z",
    createdAt: "2025-01-20T04:00:00Z",
    tags: ["retail"]
  },
  {
    id: "cash-2001",
    name: "Walk-in Customer",
    contact: null,
    customerType: "cash",
    openingBalance: 0,
    creditLimit: 0,
    outstanding: 0,
    totalSales: 0
  },
  {
    id: "cash-2002",
    name: "Anita Rao",
    contact: "+91 80221 33445",
    customerType: "cash",
    openingBalance: 0,
    creditLimit: 0,
    outstanding: 0,
    totalSales: 4200,
    lastPurchase: "2026-06-28T14:00:00Z",
    createdAt: "2026-06-28T14:00:00Z"
  },
  {
    id: "acct-1004",
    name: "Mega Mart Distributors",
    contact: "+91 99001 22334",
    customerType: "account",
    gstin: "29LMNOP9012Q1Z8",
    billingAddress: "KR Market, Bengaluru, KA 560002",
    openingBalance: 320000,
    creditLimit: 1500000,
    outstanding: 1210000,
    totalSales: 5230000,
    lastPurchase: "2026-07-07T08:00:00Z",
    createdAt: "2024-08-09T04:00:00Z",
    tags: ["wholesale", "GST"]
  },
  {
    id: "acct-1005",
    name: "Sunrise Caterers",
    contact: "+91 96320 44556",
    customerType: "hotel",
    gstin: "29QRSTU3456V1Z1",
    openingBalance: 80000,
    creditLimit: 600000,
    outstanding: -30000,
    totalSales: 1870000,
    lastPurchase: "2026-07-05T17:20:00Z",
    createdAt: "2025-05-15T04:00:00Z",
    tags: ["hotel", "catering"]
  },
  {
    id: "cash-2003",
    name: "Vikram Singh",
    contact: "+91 98441 77889",
    customerType: "cash",
    openingBalance: 0,
    creditLimit: 0,
    outstanding: 0,
    totalSales: 1850,
    lastPurchase: "2026-07-02T10:15:00Z",
    createdAt: "2026-05-10T04:00:00Z"
  },
  {
    id: "acct-1006",
    name: "Padmavathi Provision Store",
    contact: "+91 91080 99001",
    customerType: "account",
    openingBalance: 15000,
    creditLimit: 80000,
    outstanding: 22000,
    totalSales: 560000,
    lastPurchase: "2026-06-30T16:40:00Z",
    createdAt: "2025-09-01T04:00:00Z",
    tags: ["retail"]
  },
  {
    id: "cust-sparse",
    name: "New Walk-in Account",
    contact: null,
    customerType: "cash",
    openingBalance: 0,
    creditLimit: 0,
    outstanding: 0,
    totalSales: 0,
    createdAt: "2026-07-08T04:00:00Z"
  }
];

/** Hero customer sales (acct-1001). */
export const mockSales: SaleMock[] = [
  {
    id: "s-1",
    invoiceNo: "INV-2026-0184",
    date: "2026-07-04T06:30:00Z",
    status: "unpaid",
    amount: 284500
  },
  {
    id: "s-2",
    invoiceNo: "INV-2026-0180",
    date: "2026-06-29T08:10:00Z",
    status: "paid",
    amount: 196000
  },
  {
    id: "s-3",
    invoiceNo: "INV-2026-0175",
    date: "2026-06-22T05:45:00Z",
    status: "paid",
    amount: 412000
  },
  {
    id: "s-4",
    invoiceNo: "INV-2026-0168",
    date: "2026-06-15T07:20:00Z",
    status: "paid",
    amount: 158500
  },
  {
    id: "s-5",
    invoiceNo: "INV-2026-0161",
    date: "2026-06-08T09:00:00Z",
    status: "paid",
    amount: 327000
  },
  {
    id: "s-6",
    invoiceNo: "INV-2026-0155",
    date: "2026-05-30T06:15:00Z",
    status: "paid",
    amount: 245000
  }
];

/** Hero customer estimates (acct-1001). */
export const mockEstimates: EstimateMock[] = [
  {
    id: "e-1",
    estimateNo: "EST-2026-0042",
    date: "2026-07-06T07:00:00Z",
    status: "unpaid",
    amount: 540000
  },
  {
    id: "e-2",
    estimateNo: "EST-2026-0038",
    date: "2026-06-25T08:30:00Z",
    status: "unpaid",
    amount: 315000
  },
  {
    id: "e-3",
    estimateNo: "EST-2026-0031",
    date: "2026-06-12T05:00:00Z",
    status: "paid",
    amount: 198000
  },
  {
    id: "e-4",
    estimateNo: "EST-2026-0024",
    date: "2026-05-20T10:15:00Z",
    status: "paid",
    amount: 276000
  }
];

/** Hero customer activity (acct-1001). */
export const mockActivity: ActivityEvent[] = [
  {
    id: "a-1",
    date: "2026-07-06T07:00:00Z",
    kind: "estimate",
    title: "Estimate created",
    description: "EST-2026-0042 raised for ₹5,400.00"
  },
  {
    id: "a-2",
    date: "2026-07-04T06:30:00Z",
    kind: "sale",
    title: "Sale recorded",
    description: "Invoice INV-2026-0184 for ₹2,845.00 (Unpaid)"
  },
  {
    id: "a-3",
    date: "2026-07-02T11:00:00Z",
    kind: "payment",
    title: "Payment received",
    description: "₹1,96,000.00 via UPI against INV-2026-0180"
  },
  {
    id: "a-4",
    date: "2026-06-30T14:20:00Z",
    kind: "note",
    title: "Note added",
    description: "Requested GST-compliant invoice format for all future bills."
  },
  {
    id: "a-5",
    date: "2026-06-28T09:05:00Z",
    kind: "edit",
    title: "Profile updated",
    description: "Shipping address changed to Peenya Industrial Area."
  }
];

/** Hero customer notes (acct-1001). */
export const mockNotes: NoteMock[] = [
  {
    id: "n-1",
    date: "2026-06-30T14:20:00Z",
    author: "Store Owner",
    body: "Requested GST-compliant invoice format for all future bills. Prefers digital copies over print.",
    pinned: true
  },
  {
    id: "n-2",
    date: "2026-05-12T10:00:00Z",
    author: "Counter Staff",
    body: "Pays promptly. Approve credit extension up to ₹20,000.",
    pinned: false
  }
];

/** Hero customer attachments (acct-1001). */
export const mockAttachments: AttachmentMock[] = [
  {
    id: "att-1",
    name: "GST-Certificate-2025.pdf",
    kind: "pdf",
    sizeKb: 184,
    date: "2025-04-18T04:00:00Z"
  }
];

export const heroCustomerId = "acct-1001";

export function getCustomerById(id: string): CustomerMock | undefined {
  return mockCustomers.find((c) => c.id === id);
}
