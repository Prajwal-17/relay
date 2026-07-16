import { apiClient } from "@/lib/apiClient";
import {
  TRANSACTION_TYPE,
  type StoreProfile,
  type TransactionType,
  type UnifiedTransctionWithItems
} from "@shared/types";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { formatINR, formatRupee, paisaToRupees } from "@shared/utils/utils";
import { fromMilliUnits } from "@shared/utils/milliUnits";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";

export default function PdfInvoicePage() {
  const { type } = useParams<{ type: TransactionType }>();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const { data: transaction, isLoading: isLoadingTxn } = useQuery({
    queryKey: ["transaction", type, id],
    queryFn: () => apiClient.get<UnifiedTransctionWithItems>(`/api/${type}/${id}`),
    enabled: !!id && !!type
  });

  const { data: storeProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["storeProfile"],
    queryFn: () => apiClient.get<StoreProfile>("/api/store-profile")
  });

  const isLoading = isLoadingTxn || isLoadingProfile;

  if (isLoading) {
    return (
      <div className="bg-background flex h-screen w-full items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading ...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="bg-background flex h-screen w-full items-center justify-center">
        <p className="text-destructive font-semibold">Transaction not found</p>
      </div>
    );
  }

  const billingNo = transaction.transactionNo;
  const isSale = type?.slice(0, -1) === TRANSACTION_TYPE.SALE;

  const formattedDate = formatDateStrToISTDateTimeStr(
    transaction.createdAt || new Date().toISOString()
  );

  const totalAmount = transaction.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const subtotal = formatRupee(totalAmount);
  const temp = Math.round(paisaToRupees(totalAmount));
  const grandTotal = formatINR.format(temp);

  return (
    <div
      id="pdf-ready-marker"
      className="bg-background-secondary flex min-h-screen justify-center p-8 print:bg-white print:p-0"
    >
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 10mm; }
        `}
      </style>
      <div className="bg-invoice-bg text-invoice-text flex min-h-[297mm] w-full max-w-[210mm] flex-col p-12 font-sans shadow-2xl print:m-0 print:min-h-0 print:w-full print:max-w-none print:p-0 print:shadow-none">
        <div className="border-invoice-border mb-8 flex items-start justify-between border-b-2 pb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-invoice-accent font-serif text-2xl font-bold tracking-tight">
              {storeProfile?.storeName || "STORE NAME"}
            </h1>
            <div className="text-invoice-text-muted mt-2 text-sm leading-relaxed">
              <p>{storeProfile?.addressLine1}</p>
              {storeProfile?.addressLine2 && <p>{storeProfile?.addressLine2}</p>}
              <p>
                {storeProfile?.city}, {storeProfile?.state} {storeProfile?.pincode}
              </p>
              <a
                href={`tel:+91${storeProfile?.phone}`}
                className="text-invoice-text mt-1 font-medium hover:underline"
              >
                +91 {storeProfile?.phone}
              </a>
            </div>
          </div>

          <div className="flex flex-col items-end text-right">
            <div className="flex flex-col gap-1 text-sm">
              <p className="text-invoice-text bg-invoice-table-header-bg rounded-md px-3 py-1 font-semibold">
                <span className="text-invoice-text mr-2 font-normal">
                  {isSale ? "Sale #:" : "Estimate #:"}
                </span>
                {billingNo}
              </p>
              <p className="text-invoice-text text-xs">{formattedDate}</p>
            </div>
            {isSale && storeProfile?.gstin && (
              <p className="text-invoice-text mt-4 text-xs font-semibold uppercase tracking-widest">
                GSTIN: {storeProfile.gstin}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-0.5 text-sm">
          <p className="text-invoice-text-muted text-[10px] font-semibold uppercase tracking-wider">
            Billed To:
          </p>
          <p className="text-invoice-text text-xs">
            {transaction.customer?.name || "Cash Customer"}
            {transaction.customer?.contact && (
              <span className="text-invoice-text-muted ml-1 font-normal">
                (+91 {transaction.customer.contact})
              </span>
            )}
          </p>
        </div>

        <div className="flex-1">
          <table className="w-full border-collapse text-left">
            <thead className="print:table-header-group">
              <tr className="bg-invoice-table-header-bg border-invoice-border border-b">
                <th className="text-invoice-text w-12 rounded-tl-md px-2 py-2 text-sm font-semibold">
                  #
                </th>
                <th className="text-invoice-text px-2 py-2 text-sm font-semibold">Item Name</th>
                <th className="text-invoice-text px-2 py-2 text-right text-sm font-semibold">
                  Qty
                </th>
                <th className="text-invoice-text px-2 py-2 text-right text-sm font-semibold">
                  Unit Price
                </th>
                <th className="text-invoice-text rounded-tr-md px-2 py-2 text-right text-sm font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="text-sm print:table-row-group">
              {transaction.items.map((item, idx) => (
                <tr
                  key={item.id}
                  className="border-invoice-border/50 hover:bg-invoice-table-header-bg/50 border-b transition-colors print:break-inside-avoid"
                >
                  <td className="text-invoice-text px-2 py-1.5">{idx + 1}</td>
                  <td className="px-2 py-1.5 font-medium">{item.productSnapshot}</td>
                  <td className="text-invoice-text px-2 py-1.5 text-right">
                    {fromMilliUnits(item.quantity)}
                  </td>
                  <td className="text-invoice-text px-2 py-1.5 text-right">
                    {formatRupee(item.price)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-semibold">
                    {formatRupee(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end pt-8">
          <div className="flex w-64 flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-invoice-text font-medium">Subtotal:</span>
              <span className="text-invoice-text font-semibold">{subtotal}</span>
            </div>
            <div className="bg-invoice-border h-px w-full"></div>
            <div className="flex items-center justify-between text-lg">
              <span className="text-invoice-text font-bold">Total:</span>
              <span className="text-invoice-accent text-xl font-black">{grandTotal}</span>
            </div>
          </div>
        </div>

        <div className="border-invoice-border mt-16 flex flex-col items-center justify-center border-t pt-8 text-center">
          <p className="text-invoice-accent mb-1 font-serif text-lg italic">Thank you!</p>
        </div>
      </div>
    </div>
  );
}
