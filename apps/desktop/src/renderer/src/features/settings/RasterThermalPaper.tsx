import { cn } from "@/lib/utils";
import type { RawLedgerStatementData, RawReceiptData, ReceiptCutMode } from "@shared/types";
import {
  buildThermalUpiUri,
  formatThermalLedgerDate,
  formatThermalReceiptDate,
  receiptDocumentLabel
} from "@shared/utils/thermalReceipt";
import { formatRupee, paisaToRupeeString } from "@shared/utils/utils";
import { QRCodeSVG } from "qrcode.react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Check, Scissors } from "lucide-react";

export const RASTER_PAPER_WIDTH = 576;

type RasterReceiptSegment = "preview" | "body" | "after-qr";

const paperStyle = {
  width: RASTER_PAPER_WIDTH,
  fontFamily: "InterVariable, system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums"
} as const;

function ReceiptAmount({
  paisa,
  prefix = false,
  className = ""
}: {
  paisa: number;
  prefix?: boolean;
  className?: string;
}) {
  const formattedAmount = formatRupee(paisa).replace("₹", "");
  return (
    <span className={cn("shrink-0 whitespace-nowrap tabular-nums", className)}>
      {prefix ? "Rs." : ""}
      {formattedAmount}
    </span>
  );
}

function ReceiptFooter({ message }: { message?: string }) {
  if (!message?.trim()) return null;
  return (
    <div className="pt-5 pb-6 text-center text-[19px] leading-[1.35] font-[700]">{message}</div>
  );
}

function CheckedQuantity({ item }: { item: RawReceiptData["items"][number] }) {
  const quantity = Number(item.quantity);
  const checkedQuantity = Number(item.checkedQty ?? 0);
  if (!Number.isFinite(checkedQuantity) || checkedQuantity <= 0) return <>{item.quantity}</>;

  const partiallyChecked = Number.isFinite(quantity) && checkedQuantity < quantity;
  return (
    <span
      className="inline-flex flex-wrap items-center justify-end gap-x-1 tabular-nums"
      aria-label={`${item.checkedQty} of ${item.quantity} checked`}
    >
      <span>{item.quantity}</span>
      {partiallyChecked ? <span>({item.checkedQty})</span> : null}
      <Check className="size-[17px] shrink-0" strokeWidth={4} aria-hidden="true" />
    </span>
  );
}

function RasterReceiptBody({
  receipt,
  includeFooter
}: {
  receipt: RawReceiptData;
  includeFooter: boolean;
}) {
  const label = receiptDocumentLabel(receipt);
  const documentNumber = receipt.transactionNo > 0 ? String(receipt.transactionNo) : "New";

  return (
    <div data-raster-segment="body">
      <header className="px-8 pt-7 pb-4 text-center">
        <h2 className="m-0 text-[29px] leading-[1.12] font-[800] tracking-[-0.015em] break-words uppercase">
          {receipt.storeName}
        </h2>
        {receipt.addressLines.length > 0 ? (
          <div className="mt-2 text-[19px] leading-[1.28] font-medium">
            {receipt.addressLines.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        ) : null}
        {receipt.phone ? (
          <div className="text-[19px] leading-[1.28] font-medium">Phone: {receipt.phone}</div>
        ) : null}
        {receipt.transactionType === "sale" && receipt.gstin ? (
          <div className="text-[19px] leading-[1.28] font-medium">GSTIN: {receipt.gstin}</div>
        ) : null}
      </header>

      <main className="px-8">
        <div className="border-y-2 border-dashed border-black py-2.5 text-[19px] leading-[1.32] font-medium">
          <div>
            <span className="font-[700]">{label}: </span>
            <span className="font-[650] tabular-nums">{documentNumber}</span>
          </div>
          <div>
            <span className="font-[700]">Date: </span>
            <span className="tabular-nums">{formatThermalReceiptDate(receipt.dateTime)}</span>
          </div>
          {receipt.customerName ? (
            <div className="break-words">
              <span className="font-[700]">Customer: </span>
              <span>{receipt.customerName}</span>
            </div>
          ) : null}
        </div>

        <section>
          <div className="grid grid-cols-[28px_minmax(0,1fr)_92px_78px_108px] border-b-2 border-dashed border-black py-2 text-[17px] leading-none font-[800] uppercase">
            <span>#</span>
            <span>Item</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Amt</span>
          </div>
          <div className="border-b-2 border-dashed border-black py-1">
            {receipt.items.map((item, index) => (
              <article
                key={index}
                className="grid grid-cols-[28px_minmax(0,1fr)_92px_78px_108px] items-start py-2 text-[19px] leading-[1.25] font-medium"
              >
                <span className="tabular-nums">{index + 1}.</span>
                <span className="min-w-0 pr-2 font-[700] break-words">{item.name}</span>
                <span className="min-w-0 text-right font-[650]">
                  <CheckedQuantity item={item} />
                </span>
                <ReceiptAmount paisa={item.unitPricePaisa} className="text-right" />
                <ReceiptAmount paisa={item.totalPaisa} className="text-right font-[700]" />
              </article>
            ))}
          </div>
        </section>

        <section className="pt-2 pb-1 text-[20px] leading-[1.3]">
          <div className="flex items-baseline justify-between gap-6 font-[600]">
            <span>Subtotal</span>
            <ReceiptAmount paisa={receipt.subtotalPaisa} />
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-6 font-[800]">
            <span className="text-[24px]">TOTAL</span>
            <ReceiptAmount paisa={receipt.totalPaisa} prefix className="text-[26px]" />
          </div>
        </section>

        {receipt.savingsPaisa != null && receipt.savingsPaisa > 0 ? (
          <div className="pt-4 text-center text-[20px] leading-[1.25] font-[750]">
            YOU SAVED Rs.{paisaToRupeeString(receipt.savingsPaisa)}
          </div>
        ) : null}

        <div className="h-5" />
        {includeFooter ? <ReceiptFooter message={receipt.footerMessage} /> : null}
      </main>
    </div>
  );
}

function RasterAfterQr({
  receipt,
  includeFooter
}: {
  receipt: RawReceiptData;
  includeFooter: boolean;
}) {
  return (
    <div data-raster-segment="after-qr" className="px-8 pt-3 text-center">
      <div className="text-[19px] leading-[1.3] font-[700]">Scan to pay</div>
      {receipt.upi?.payeeName ? (
        <div className="text-[19px] leading-[1.3] font-medium">{receipt.upi.payeeName}</div>
      ) : null}
      {includeFooter ? <ReceiptFooter message={receipt.footerMessage} /> : <div className="h-5" />}
    </div>
  );
}

export function RasterReceiptPaper({
  receipt,
  segment = "preview",
  omitFooter = false
}: {
  receipt: RawReceiptData;
  segment?: RasterReceiptSegment;
  omitFooter?: boolean;
}) {
  const upiUri = buildThermalUpiUri(receipt);
  const includeFooterInBody = !omitFooter && !upiUri;

  return (
    <div
      style={paperStyle}
      className="bg-white text-black"
      data-testid="raster-receipt-paper"
      role="group"
      aria-label={`80 millimetre ${receipt.transactionType} raster receipt`}
    >
      {segment !== "after-qr" ? (
        <RasterReceiptBody receipt={receipt} includeFooter={includeFooterInBody} />
      ) : null}
      {segment === "preview" && upiUri ? (
        <>
          <div className="flex justify-center bg-white py-1" data-preview-only-qr>
            <QRCodeSVG
              value={upiUri}
              level="M"
              boostLevel={false}
              marginSize={4}
              size={174}
              bgColor="#ffffff"
              fgColor="#000000"
              title="UPI payment QR preview"
            />
          </div>
          <RasterAfterQr receipt={receipt} includeFooter={!omitFooter} />
        </>
      ) : null}
      {segment === "after-qr" ? (
        <RasterAfterQr receipt={receipt} includeFooter={!omitFooter} />
      ) : null}
    </div>
  );
}

export function RasterLedgerPaper({
  statement,
  includeHeader = true,
  includeFooter = true
}: {
  statement: RawLedgerStatementData;
  includeHeader?: boolean;
  includeFooter?: boolean;
}) {
  return (
    <div
      style={paperStyle}
      className="bg-white text-black"
      data-testid="raster-ledger-paper"
      data-raster-segment="body"
      role="group"
      aria-label="80 millimetre customer ledger raster"
    >
      {includeHeader ? (
        <header className="px-8 pt-7 pb-4 text-center">
          <h2 className="m-0 text-[29px] leading-[1.12] font-[800] tracking-[-0.015em] break-words uppercase">
            {statement.storeName}
          </h2>
          {statement.addressLines.length > 0 ? (
            <div className="mt-2 text-[19px] leading-[1.28] font-medium">
              {statement.addressLines.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          ) : null}
          {statement.phone ? (
            <div className="text-[19px] leading-[1.28] font-medium">Phone: {statement.phone}</div>
          ) : null}
        </header>
      ) : (
        <div className="h-5" />
      )}

      <main className="mx-8 border-t-2 border-dashed border-black">
        <h3 className="m-0 py-2.5 text-center text-[22px] leading-none font-[800] tracking-[0.04em]">
          ACCOUNTS
        </h3>
        <div className="border-y-2 border-dashed border-black py-2.5 text-[19px] leading-[1.3]">
          <span className="font-[700]">Customer: </span>
          <span className="font-[700]">{statement.customerName}</span>
        </div>

        <div className="border-b-2 border-dashed border-black py-1">
          {statement.entries.map((entry, index) => {
            const amount = entry.amountPaidPaisa > 0 ? entry.amountPaidPaisa : entry.amountDuePaisa;
            return (
              <article key={index} className="py-2 text-[19px] leading-[1.28]">
                <div className="font-medium tabular-nums">
                  {formatThermalLedgerDate(entry.dateTime)}
                </div>
                <div className="flex items-baseline justify-between gap-5">
                  <span className="min-w-0 font-[700] break-words">{entry.particulars}</span>
                  <ReceiptAmount paisa={amount} prefix className="font-[750]" />
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex items-baseline justify-between gap-6 py-3 text-[22px] leading-none font-[800]">
          <span>TOTAL AMOUNT</span>
          <ReceiptAmount
            paisa={statement.closingBalancePaisa}
            prefix
            className="text-[24px] tracking-[-0.01em]"
          />
        </div>
      </main>

      <div className="px-8">
        {includeFooter ? (
          <ReceiptFooter message={statement.footerMessage} />
        ) : (
          <div className="h-5" />
        )}
      </div>
    </div>
  );
}

export function ScaledThermalPaper({
  children,
  extraFeedLines,
  cutMode
}: {
  children: ReactNode;
  extraFeedLines: number;
  cutMode: ReceiptCutMode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const paper = paperRef.current;
    if (!frame || !paper) return;

    const measure = () => {
      const scale = Math.min(1, frame.clientWidth / RASTER_PAPER_WIDTH);
      setLayout({ scale, height: paper.offsetHeight * scale });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(paper);
    return () => observer.disconnect();
  }, [children, cutMode, extraFeedLines]);

  return (
    <div ref={frameRef} className="w-full" style={{ height: layout.height || undefined }}>
      <div
        ref={paperRef}
        className="border-invoice-border origin-top-left overflow-hidden border bg-white shadow-sm"
        style={{ width: RASTER_PAPER_WIDTH, transform: `scale(${layout.scale})` }}
      >
        {children}
        {extraFeedLines > 0 ? (
          <div
            className="bg-white"
            style={{ height: extraFeedLines * 24 }}
            aria-label={`${extraFeedLines} extra feed line${extraFeedLines === 1 ? "" : "s"}`}
            data-testid="thermal-receipt-feed"
          />
        ) : null}
        {cutMode !== "none" ? (
          <div
            className="relative h-5 border-t-2 border-dashed border-black bg-white"
            aria-label={`${cutMode} cut`}
            data-testid="thermal-receipt-cut"
          >
            <Scissors className="absolute -top-3 left-6 size-5 bg-white pr-1 text-black" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
