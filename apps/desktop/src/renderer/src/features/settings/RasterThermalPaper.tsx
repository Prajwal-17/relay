import { cn } from "@/lib/utils";
import type { RawLedgerStatementData, RawReceiptData, ReceiptCutMode } from "@shared/types";
import {
  buildThermalUpiUri,
  formatThermalLedgerDate,
  formatThermalLedgerAmount,
  getLedgerPreviousBalance,
  formatThermalReceiptDate,
  receiptDocumentLabel
} from "@shared/utils/thermalReceipt";
import { formatRupee, paisaToRupeeString } from "@shared/utils/utils";
import { QRCodeSVG } from "qrcode.react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Check, Scissors } from "lucide-react";

export const RASTER_PAPER_WIDTH = 576;
export const RASTER_UPI_QR_SIZE = 224;

type RasterReceiptSegment = "preview" | "body" | "qr" | "after-qr";

const paperStyle = {
  width: RASTER_PAPER_WIDTH,
  fontFamily: "InterVariable, system-ui, sans-serif",
  fontVariantNumeric: "tabular-nums"
} as const;

const receiptPaperStyle = {
  ...paperStyle,
  fontSynthesis: "none",
  letterSpacing: "normal"
} as const;

const receiptItemGridStyle = {
  gridTemplateColumns: "32px minmax(0, 1fr) 92px 84px 108px"
} as const;

function ReceiptAmount({
  paisa,
  prefix = false,
  fractionDisplay = "fixed",
  className = ""
}: {
  paisa: number;
  prefix?: boolean;
  fractionDisplay?: "fixed" | "compact";
  className?: string;
}) {
  const formattedAmount =
    fractionDisplay === "compact" ? paisaToRupeeString(paisa) : formatRupee(paisa).replace("₹", "");
  return (
    <span className={cn("shrink-0 whitespace-nowrap tabular-nums", className)} data-receipt-amount>
      {prefix ? "Rs." : ""}
      {formattedAmount}
    </span>
  );
}

function ReceiptFooter({ message, className = "" }: { message?: string; className?: string }) {
  if (!message?.trim()) return null;
  return (
    <div className={cn("pt-5 pb-6 text-center text-[19px] leading-[1.35] font-[700]", className)}>
      {message}
    </div>
  );
}

function ReceiptSavings({ paisa }: { paisa?: number }) {
  if (paisa == null || paisa <= 0) return null;
  return (
    <div
      className="pt-3 pb-4 text-center text-[26px] leading-[1.2] font-[600]"
      data-testid="raster-receipt-savings"
    >
      *** YOU SAVED Rs.{paisaToRupeeString(paisa)} ***
    </div>
  );
}

function RasterAccountSettlement({
  settlement
}: {
  settlement: NonNullable<RawReceiptData["accountSettlement"]>;
}) {
  const rows: Array<readonly [string, number]> = [
    ["Previous balance", settlement.previousBalancePaisa],
    ["Current bill (+)", settlement.currentBillPaisa]
  ];
  if (settlement.paymentPaisa > 0) {
    rows.push(["Payment (-)", settlement.paymentPaisa]);
  }

  return (
    <section
      className="mx-auto mt-2 w-full max-w-[470px] border-y border-dashed border-black py-2"
      data-testid="raster-account-settlement"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-5 gap-y-0.5 text-2xl leading-[1.25] font-[400]">
        {rows.map(([label, paisa]) => (
          <div key={label} className="contents">
            <span>{label}</span>
            <span className="text-right font-[500] whitespace-nowrap tabular-nums">
              {formatRupee(paisa).replace("₹", "Rs.")}
            </span>
          </div>
        ))}
        <span className="mt-1 border-t border-black pt-1 text-3xl font-[700]">BALANCE</span>
        <span className="mt-1 border-t border-black pt-1 text-right text-3xl font-[700] whitespace-nowrap tabular-nums">
          {formatRupee(settlement.balancePaisa).replace("₹", "Rs.")}
        </span>
      </div>
    </section>
  );
}

function CheckedQuantity({ item }: { item: RawReceiptData["items"][number] }) {
  const quantity = Number(item.quantity);
  const checkedQuantity = Number(item.checkedQty ?? 0);
  if (!Number.isFinite(checkedQuantity) || checkedQuantity <= 0) return <>{item.quantity}</>;

  const partiallyChecked = Number.isFinite(quantity) && checkedQuantity < quantity;
  return (
    <span
      className="inline-flex items-center justify-end gap-x-1 align-middle leading-none whitespace-nowrap tabular-nums"
      aria-label={`${item.checkedQty} of ${item.quantity} checked`}
    >
      <span>{item.quantity}</span>
      {partiallyChecked ? (
        <span>({item.checkedQty})</span>
      ) : (
        <Check className="size-[18px] shrink-0 self-center" strokeWidth={3} aria-hidden="true" />
      )}
    </span>
  );
}

function formatRasterReceiptDate(dateTime: string): string {
  const formattedDate = formatThermalReceiptDate(dateTime);
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return formattedDate;

  const weekday = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    timeZone: "Asia/Kolkata"
  }).format(date);
  return weekday + ", " + formattedDate;
}

function RasterReceiptBody({
  receipt,
  includeFooter,
  includeSavings
}: {
  receipt: RawReceiptData;
  includeFooter: boolean;
  includeSavings: boolean;
}) {
  const label = receiptDocumentLabel(receipt);
  const documentNumber = receipt.transactionNo > 0 ? String(receipt.transactionNo) : "New";

  return (
    <div data-raster-segment="body">
      <header className="px-1 pt-7 pb-4 text-center">
        <h2
          className="m-0 text-[36px] leading-[1.12] font-[700] break-words uppercase"
          data-testid="raster-receipt-store-name"
        >
          {receipt.storeName}
        </h2>
        {receipt.addressLines.length > 0 ? (
          <div className="mt-2 text-[24px] leading-[1.25] font-[400]">
            {receipt.addressLines.map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        ) : null}
        {receipt.phone ? (
          <div className="text-[24px] leading-[1.25] font-[400]">Phone: {receipt.phone}</div>
        ) : null}
        {receipt.transactionType === "sale" && receipt.gstin ? (
          <div className="text-[24px] leading-[1.25] font-[400]">GSTIN: {receipt.gstin}</div>
        ) : null}
      </header>

      <main className="px-1">
        <div
          className="border-y border-dashed border-black py-2.5 text-[24px] leading-[1.3] font-[400]"
          data-testid="raster-receipt-meta"
        >
          <div>
            <span className="font-[600]">{label}: </span>
            <span className="font-[600] tabular-nums">{documentNumber}</span>
          </div>
          <div>
            <span className="font-[600]">Date: </span>
            <span className="tabular-nums">{formatRasterReceiptDate(receipt.dateTime)}</span>
          </div>
          {receipt.customerName ? (
            <div className="break-words">
              <span className="font-[600]">Customer: </span>
              <span>{receipt.customerName}</span>
            </div>
          ) : null}
        </div>

        <section>
          <div
            className="grid border-b border-dashed border-black py-2.5 text-[22px] leading-none font-[700] uppercase"
            style={receiptItemGridStyle}
            data-testid="raster-receipt-item-header"
          >
            <span>#</span>
            <span>Item</span>
            <span className="w-full text-right">Qty</span>
            <span className="w-full text-right">Rate</span>
            <span className="w-full text-right">Amt</span>
          </div>
          <div
            className="border-b border-dashed border-black py-1"
            data-testid="raster-receipt-items"
          >
            {receipt.items.map((item, index) => (
              <article
                key={index}
                className="grid items-start py-1 text-[24px] leading-[1.2] font-[500]"
                style={receiptItemGridStyle}
                data-testid="raster-receipt-item-row"
              >
                <span className="tabular-nums">{index + 1}.</span>
                <span className="min-w-0 pr-3 font-[500] break-words">{item.name}</span>
                <span className="w-full min-w-0 text-right font-[500]">
                  <CheckedQuantity item={item} />
                </span>
                <ReceiptAmount
                  paisa={item.unitPricePaisa}
                  fractionDisplay="compact"
                  className="block w-full text-right font-[500]"
                />
                <ReceiptAmount
                  paisa={item.totalPaisa}
                  fractionDisplay="compact"
                  className="block w-full text-right font-[500]"
                />
              </article>
            ))}
          </div>
        </section>

        <section className="pt-2 pb-1">
          <div
            className="ml-auto grid w-fit max-w-full min-w-[330px] grid-cols-[auto_minmax(140px,auto)] items-baseline gap-x-4"
            data-testid="raster-receipt-summary"
          >
            <span className="justify-self-end text-[25px] leading-[1.25] font-[400]">Subtotal</span>
            <ReceiptAmount
              paisa={receipt.subtotalPaisa}
              className="justify-self-end text-right text-[25px] leading-[1.25] font-[500]"
            />
            <span className="mt-1.5 justify-self-end text-[30px] leading-none font-[600]">
              TOTAL
            </span>
            <ReceiptAmount
              paisa={receipt.totalPaisa}
              prefix
              className="mt-1.5 justify-self-end text-right text-[33px] leading-none font-[600]"
            />
          </div>
        </section>

        {receipt.accountSettlement ? (
          <RasterAccountSettlement settlement={receipt.accountSettlement} />
        ) : null}

        <div
          className={includeSavings ? "h-5" : "h-8"}
          data-testid="raster-receipt-before-qr-gap"
        />
        {includeFooter ? (
          <ReceiptFooter
            message={receipt.footerMessage}
            className="text-[24px] leading-[1.3] font-[500]"
          />
        ) : null}
        <ReceiptSavings paisa={includeSavings ? receipt.savingsPaisa : undefined} />
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
    <div data-raster-segment="after-qr" className="px-1 pt-0 text-center">
      <div className="text-[24px] leading-[1.3] font-[500]">Scan to pay</div>
      {receipt.upi?.payeeName ? (
        <div className="text-[24px] leading-[1.3] font-[400]">{receipt.upi.payeeName}</div>
      ) : null}
      {includeFooter ? (
        <ReceiptFooter
          message={receipt.footerMessage}
          className="text-[24px] leading-[1.3] font-[500]"
        />
      ) : (
        <div className="h-5" />
      )}
      <ReceiptSavings paisa={receipt.savingsPaisa} />
    </div>
  );
}

function RasterQr({ value, printable = false }: { value: string; printable?: boolean }) {
  return (
    <div
      className="flex justify-center bg-white pt-1"
      data-qr-value={value}
      {...(printable ? { "data-raster-segment": "qr" } : { "data-preview-only-qr": true })}
    >
      <QRCodeSVG
        value={value}
        level="M"
        boostLevel={false}
        marginSize={4}
        size={RASTER_UPI_QR_SIZE}
        bgColor="#ffffff"
        fgColor="#000000"
        title={printable ? "UPI payment QR" : "UPI payment QR preview"}
      />
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
      style={receiptPaperStyle}
      className="bg-white text-black"
      data-testid="raster-receipt-paper"
      role="group"
      aria-label={`80 millimetre ${receipt.transactionType} raster receipt`}
    >
      {segment === "preview" || segment === "body" ? (
        <RasterReceiptBody
          receipt={receipt}
          includeFooter={includeFooterInBody}
          includeSavings={!upiUri}
        />
      ) : null}
      {segment === "preview" && upiUri ? (
        <>
          <RasterQr value={upiUri} />
          <RasterAfterQr receipt={receipt} includeFooter={!omitFooter} />
        </>
      ) : null}
      {segment === "qr" && upiUri ? <RasterQr value={upiUri} printable /> : null}
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
  const balanceRows = [
    { label: "Previous balance", amount: getLedgerPreviousBalance(statement) },
    { label: "Charges", amount: statement.totalDuePaisa },
    { label: "Payments", amount: -statement.totalPaidPaisa },
    { label: "Balance", amount: statement.closingBalancePaisa }
  ];

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

      <main className="mx-8 pb-3">
        <h3 className="m-0 py-2.5 text-center text-[22px] leading-none font-[800] tracking-[0.04em]">
          ACCOUNTS
        </h3>
        <div className="pb-3 text-[19px] leading-[1.3]">
          <span className="font-[700]">Customer: </span>
          <span className="font-[700]">{statement.customerName}</span>
        </div>

        <div className="py-1" data-testid="raster-ledger-entries">
          {statement.entries.map((entry, index) => {
            const amount =
              entry.amountPaidPaisa > 0 ? -entry.amountPaidPaisa : entry.amountDuePaisa;
            return (
              <article key={index} className="py-2 text-[19px] leading-[1.28]">
                <div className="font-medium tabular-nums">
                  {formatThermalLedgerDate(entry.dateTime)}
                </div>
                <div className="flex items-baseline justify-between gap-5">
                  <span className="min-w-0 font-[700] break-words">{entry.particulars}</span>
                  <span className="shrink-0 font-[750] tabular-nums">
                    {formatThermalLedgerAmount(amount)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-5 tabular-nums">
                  <span>Balance</span>
                  <span className="shrink-0">
                    {formatThermalLedgerAmount(entry.runningBalancePaisa)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
        <div className="border-t-2 border-black pt-2 text-[19px] leading-[1.4]">
          {balanceRows.map((row, index) => (
            <div
              key={row.label}
              className={cn(
                "flex items-baseline justify-between gap-5 tabular-nums",
                index === balanceRows.length - 1 && "font-[800]"
              )}
            >
              <span>{row.label}</span>
              <span className="shrink-0">{formatThermalLedgerAmount(row.amount)}</span>
            </div>
          ))}
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
      const height = paper.offsetHeight * scale;
      setLayout((current) =>
        current.scale === scale && current.height === height ? current : { scale, height }
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(paper);
    return () => observer.disconnect();
  }, []);

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
