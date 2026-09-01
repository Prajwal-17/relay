import { ErrorState } from "@/components/app-ui/ErrorState";
import { ApiError, apiClient } from "@/lib/apiClient";
import { type StoreProfile, type UnifiedTransctionWithItems } from "@shared/types";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { fromMilliUnits } from "@shared/utils/milliUnits";
import { formatRupee, roundPaisaToNearestRupee } from "@shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import { FileWarning, LoaderCircle } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";

export default function PdfInvoicePage() {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const hasValidParams = Boolean(id?.trim()) && (type === "sales" || type === "estimates");

  const {
    data: transaction,
    isLoading: isLoadingTxn,
    isError: isTxnError,
    error: txnError,
    refetch: refetchTxn,
    isFetching: isFetchingTxn
  } = useQuery({
    queryKey: ["transaction", type, id],
    queryFn: () => apiClient.get<UnifiedTransctionWithItems>(`/api/${type}/${id}`),
    enabled: hasValidParams
  });

  const {
    data: storeProfile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    refetch: refetchProfile,
    isFetching: isFetchingProfile
  } = useQuery({
    queryKey: ["storeProfile"],
    queryFn: () => apiClient.get<StoreProfile>("/api/store-profile"),
    enabled: hasValidParams
  });

  const isLoading = isLoadingTxn || isLoadingProfile;

  if (!hasValidParams) {
    return (
      <div
        className="bg-background h-screen w-full"
        data-pdf-export-error="This PDF link is invalid."
      >
        <ErrorState
          layout="page"
          title="This PDF link is invalid"
          description="The transaction type or identifier is missing. Close this window and export the bill again."
          primaryAction={{ label: "Close window", onClick: () => window.close() }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-background flex h-screen w-full items-center justify-center p-3">
        <div className="border-border bg-card flex min-w-56 flex-col items-center gap-3 rounded-(--radius-panel) border p-4">
          <LoaderCircle className="text-marker size-7 animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Preparing invoice…</p>
        </div>
      </div>
    );
  }

  if (isTxnError) {
    const isNotFound = txnError instanceof ApiError && txnError.status === 404;
    return (
      <div
        className="bg-background h-screen w-full"
        data-pdf-export-error={
          isNotFound ? "Transaction not found." : "Transaction could not be loaded."
        }
      >
        <ErrorState
          layout="page"
          title={isNotFound ? "Transaction not found" : "Transaction could not be loaded"}
          description={
            isNotFound
              ? "It may have been deleted. Close this window and export again."
              : "Try loading the transaction again, or close this window and export again."
          }
          primaryAction={
            isNotFound
              ? { label: "Close window", onClick: () => window.close() }
              : { label: "Try again", onClick: () => void refetchTxn(), loading: isFetchingTxn }
          }
          secondaryAction={
            isNotFound ? undefined : { label: "Close window", onClick: () => window.close() }
          }
        />
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div
        className="bg-background h-screen w-full"
        data-pdf-export-error="Store details could not be loaded."
      >
        <ErrorState
          layout="page"
          title="Store details could not be loaded"
          description="QuickCart will not create a PDF with missing shop details. Try again or close this window."
          primaryAction={{
            label: "Try again",
            onClick: () => void refetchProfile(),
            loading: isFetchingProfile
          }}
          secondaryAction={{ label: "Close window", onClick: () => window.close() }}
        />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div
        className="bg-background flex h-screen w-full items-center justify-center p-3"
        data-pdf-export-error="Transaction not found."
      >
        <div className="border-border bg-card flex min-w-64 flex-col items-center gap-2 rounded-(--radius-panel) border p-4 text-center">
          <FileWarning className="text-destructive size-6" />
          <p className="text-foreground text-sm font-semibold">Transaction not found</p>
          <p className="text-muted-foreground text-xs">
            Close this window and try exporting again.
          </p>
        </div>
      </div>
    );
  }

  const billingNo = transaction.transactionNo;
  const isSale = type === "sales";

  const formattedDate = formatDateStrToISTDateTimeStr(
    transaction.createdAt || new Date().toISOString()
  );

  const totalAmount = transaction.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const subtotal = formatRupee(totalAmount);
  const grandTotal = formatRupee(roundPaisaToNearestRupee(totalAmount));

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
      <div className="bg-invoice-bg text-invoice-text flex min-h-[297mm] w-full max-w-[210mm] flex-col p-12 font-sans shadow-2xl print:m-0 print:min-h-0 print:w-full print:max-w-none print:bg-white print:p-0 print:shadow-none">
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
              <p className="text-invoice-text mt-4 text-xs font-semibold tracking-widest uppercase">
                GSTIN: {storeProfile.gstin}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-0.5 text-sm">
          <p className="text-invoice-text-muted text-xs font-semibold tracking-wider uppercase">
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
