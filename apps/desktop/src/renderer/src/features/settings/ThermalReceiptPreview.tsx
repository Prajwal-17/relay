import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import type {
  PrintingConfig,
  RawLedgerStatementData,
  RawReceiptData,
  StoreProfile
} from "@shared/types";
import {
  buildThermalUpiUri,
  fitThermalText,
  formatThermalReceiptDate,
  receiptDocumentLabel,
  thermalItemLines,
  thermalLedgerEntryLines,
  THERMAL_RECEIPT_ITEM_WIDTHS,
  THERMAL_RECEIPT_LINE_WIDTH,
  wrapThermalText
} from "@shared/utils/thermalReceipt";
import { paisaToRupeeString } from "@shared/utils/utils";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpenText,
  FileText,
  Loader2,
  Maximize2,
  ReceiptText,
  ScanLine,
  Scissors
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { buildThermalPreviewLedger, buildThermalPreviewReceipt } from "./thermalReceiptPreviewData";
import { RasterLedgerPaper, RasterReceiptPaper, ScaledThermalPaper } from "./RasterThermalPaper";

type PreviewDocumentType = RawReceiptData["transactionType"] | "ledger";

const PREVIEW_DOCUMENTS = [
  { value: "sale", label: "Sale", icon: ReceiptText },
  { value: "estimate", label: "Estimate", icon: FileText },
  { value: "ledger", label: "Ledger", icon: BookOpenText }
] as const;

function ReceiptLine({
  children,
  align = "left",
  bold = false,
  className = ""
}: {
  children?: string;
  align?: "left" | "center";
  bold?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "font-mono text-[clamp(9px,2.75cqw,12px)] leading-[1.65] tracking-[0.015em] whitespace-pre tabular-nums",
        align === "center" ? "text-center" : "text-left",
        bold ? "font-bold" : "font-medium",
        className
      ].join(" ")}
    >
      {children || "\u00a0"}
    </div>
  );
}

export function DeviceTextReceiptPaper({ receipt }: { receipt: RawReceiptData }) {
  const documentLabel = receiptDocumentLabel(receipt);
  const documentNumber = receipt.transactionNo > 0 ? String(receipt.transactionNo) : "New";
  const separator = "-".repeat(THERMAL_RECEIPT_LINE_WIDTH);
  const widths = THERMAL_RECEIPT_ITEM_WIDTHS;
  const itemHeader = [
    fitThermalText("#", widths.index),
    fitThermalText("ITEM", widths.name),
    fitThermalText("QTY", widths.quantity, "right"),
    fitThermalText("RATE", widths.rate, "right"),
    fitThermalText("AMT", widths.amount, "right")
  ].join("");
  const subtotalLine = `${fitThermalText("Subtotal", 39)}${fitThermalText(
    paisaToRupeeString(receipt.subtotalPaisa),
    9,
    "right"
  )}`;
  const savingsLine =
    receipt.savingsPaisa != null && receipt.savingsPaisa > 0
      ? "YOU SAVED Rs." + paisaToRupeeString(receipt.savingsPaisa)
      : undefined;
  const totalLine = `${fitThermalText("TOTAL", 30)}${fitThermalText(
    `Rs.${paisaToRupeeString(receipt.totalPaisa)}`,
    18,
    "right"
  )}`;
  const upiUri = buildThermalUpiUri(receipt);

  return (
    <div
      className="border-invoice-border bg-invoice-bg text-invoice-text [container-type:inline-size] w-full max-w-[420px] border shadow-sm"
      data-testid="thermal-receipt-paper"
      role="group"
      aria-label={`80 millimetre ${receipt.transactionType} receipt preview`}
    >
      <div className="px-4 pt-5">
        {wrapThermalText(receipt.storeName.toUpperCase(), THERMAL_RECEIPT_LINE_WIDTH / 2).map(
          (storeNameLine, index) => (
            <div
              key={`${storeNameLine}-${index}`}
              className="font-mono text-[clamp(18px,5.5cqw,24px)] leading-[1.3] font-extrabold tracking-[0.01em] break-words"
            >
              <span className="block text-center">{storeNameLine}</span>
            </div>
          )
        )}

        {receipt.addressLines
          .flatMap((addressLine) => wrapThermalText(addressLine, THERMAL_RECEIPT_LINE_WIDTH))
          .map((addressLine, index) => (
            <ReceiptLine key={`${addressLine}-${index}`} align="center">
              {addressLine}
            </ReceiptLine>
          ))}
        {receipt.phone ? (
          <ReceiptLine align="center">{`Phone: ${receipt.phone}`}</ReceiptLine>
        ) : null}
        {receipt.transactionType === "sale" && receipt.gstin ? (
          <ReceiptLine align="center">{`GSTIN: ${receipt.gstin}`}</ReceiptLine>
        ) : null}

        <ReceiptLine>{separator}</ReceiptLine>
        <ReceiptLine>{documentLabel + ": " + documentNumber}</ReceiptLine>
        <ReceiptLine>{`Date: ${formatThermalReceiptDate(receipt.dateTime)}`}</ReceiptLine>
        {receipt.customerName ? (
          <ReceiptLine>{"Customer: " + receipt.customerName}</ReceiptLine>
        ) : null}
        <ReceiptLine>{separator}</ReceiptLine>
        <ReceiptLine bold>{itemHeader}</ReceiptLine>
        <ReceiptLine>{separator}</ReceiptLine>

        {receipt.items.flatMap((item, itemIndex) =>
          thermalItemLines(itemIndex + 1, item).map((itemLine, lineIndex) => (
            <ReceiptLine key={`${itemIndex}-${lineIndex}`}>{itemLine}</ReceiptLine>
          ))
        )}

        <ReceiptLine>{separator}</ReceiptLine>
        <ReceiptLine>{subtotalLine}</ReceiptLine>
        <div className="flex h-8 items-center">
          <ReceiptLine bold className="w-full origin-center scale-y-[2]">
            {totalLine}
          </ReceiptLine>
        </div>
        {savingsLine ? (
          <>
            <ReceiptLine />
            <ReceiptLine align="center" bold>
              {savingsLine}
            </ReceiptLine>
          </>
        ) : null}

        {upiUri ? (
          <>
            <ReceiptLine />
            <div className="flex justify-center py-1.5">
              <QRCodeSVG
                value={upiUri}
                level="M"
                boostLevel={false}
                marginSize={4}
                size={164}
                bgColor="#ffffff"
                fgColor="#000000"
                title="Sample UPI payment QR"
              />
            </div>
            <ReceiptLine align="center">Scan to pay</ReceiptLine>
            <ReceiptLine align="center">{receipt.upi?.payeeName}</ReceiptLine>
          </>
        ) : null}

        {receipt.footerMessage ? (
          <>
            <ReceiptLine />
            {wrapThermalText(receipt.footerMessage, THERMAL_RECEIPT_LINE_WIDTH).map(
              (footerLine, index) => (
                <ReceiptLine key={`${footerLine}-${index}`} align="center" bold>
                  {footerLine}
                </ReceiptLine>
              )
            )}
          </>
        ) : null}

        <div
          aria-label={`${receipt.extraFeedLines} extra feed line${receipt.extraFeedLines === 1 ? "" : "s"}`}
          data-testid="thermal-receipt-feed"
        >
          {Array.from({ length: receipt.extraFeedLines }, (_, index) => (
            <ReceiptLine key={index} />
          ))}
        </div>
      </div>

      {receipt.cutMode !== "none" ? (
        <div
          className="border-invoice-border relative h-4 border-t border-dashed"
          aria-label={`${receipt.cutMode} cut`}
          data-testid="thermal-receipt-cut"
        >
          <Scissors className="bg-invoice-bg text-invoice-text-muted absolute -top-2.5 left-4 size-4 pr-1" />
        </div>
      ) : null}
    </div>
  );
}

export function DeviceTextLedgerPaper({ statement }: { statement: RawLedgerStatementData }) {
  const separator = "-".repeat(THERMAL_RECEIPT_LINE_WIDTH);
  const totalAmountLine =
    fitThermalText("TOTAL AMOUNT", 32) +
    fitThermalText("Rs." + paisaToRupeeString(statement.closingBalancePaisa), 16, "right");

  return (
    <div
      className="border-invoice-border bg-invoice-bg text-invoice-text w-full max-w-[420px] border"
      data-testid="thermal-ledger-paper"
      role="group"
      aria-label="80 millimetre customer ledger preview"
    >
      <div className="px-5 pt-5">
        {wrapThermalText(statement.storeName.toUpperCase(), THERMAL_RECEIPT_LINE_WIDTH / 2).map(
          (storeNameLine, index) => (
            <div
              key={`${storeNameLine}-${index}`}
              className="font-mono text-2xl leading-8 font-bold tracking-normal break-words"
            >
              <span className="block text-center">{storeNameLine}</span>
            </div>
          )
        )}
        {statement.addressLines
          .flatMap((addressLine) => wrapThermalText(addressLine, THERMAL_RECEIPT_LINE_WIDTH))
          .map((addressLine, index) => (
            <ReceiptLine key={`${addressLine}-${index}`} align="center">
              {addressLine}
            </ReceiptLine>
          ))}
        {statement.phone ? (
          <ReceiptLine align="center">{`Phone: ${statement.phone}`}</ReceiptLine>
        ) : null}

        <ReceiptLine>{separator}</ReceiptLine>
        <ReceiptLine align="center" bold>
          ACCOUNTS
        </ReceiptLine>
        {wrapThermalText(`Customer: ${statement.customerName}`, THERMAL_RECEIPT_LINE_WIDTH).map(
          (customerLine, index) => (
            <ReceiptLine key={`${customerLine}-${index}`}>{customerLine}</ReceiptLine>
          )
        )}
        <ReceiptLine>{separator}</ReceiptLine>

        {statement.entries.flatMap((entry, entryIndex) =>
          thermalLedgerEntryLines(entry).map((entryLine, lineIndex) => (
            <ReceiptLine key={`${entryIndex}-${lineIndex}`}>{entryLine}</ReceiptLine>
          ))
        )}

        <ReceiptLine>{separator}</ReceiptLine>
        <ReceiptLine bold>{totalAmountLine}</ReceiptLine>

        {statement.footerMessage ? (
          <>
            <ReceiptLine />
            {wrapThermalText(statement.footerMessage, THERMAL_RECEIPT_LINE_WIDTH).map(
              (footerLine, index) => (
                <ReceiptLine key={`${footerLine}-${index}`} align="center" bold>
                  {footerLine}
                </ReceiptLine>
              )
            )}
          </>
        ) : null}

        <div
          aria-label={`${statement.extraFeedLines} extra feed line${statement.extraFeedLines === 1 ? "" : "s"}`}
          data-testid="thermal-ledger-feed"
        >
          {Array.from({ length: statement.extraFeedLines }, (_, index) => (
            <ReceiptLine key={index} />
          ))}
        </div>
      </div>

      {statement.cutMode !== "none" ? (
        <div
          className="border-invoice-border relative h-4 border-t border-dashed"
          aria-label={`${statement.cutMode} cut`}
          data-testid="thermal-ledger-cut"
        >
          <Scissors className="bg-invoice-bg text-invoice-text-muted absolute -top-2.5 left-4 size-4 pr-1" />
        </div>
      ) : null}
    </div>
  );
}

function ThermalReceiptPreviewContent({ printing }: { printing: PrintingConfig }) {
  const [documentType, setDocumentType] = useState<PreviewDocumentType>("sale");
  const {
    data: profile,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["storeProfile"],
    queryFn: () => apiClient.get<StoreProfile>("/api/store-profile")
  });

  const receipt = useMemo(
    () =>
      documentType === "ledger"
        ? undefined
        : buildThermalPreviewReceipt(profile, printing, documentType),
    [documentType, printing, profile]
  );
  const ledger = useMemo(() => buildThermalPreviewLedger(profile, printing), [printing, profile]);
  const qrIsEnabled =
    documentType === "sale"
      ? printing.printUpiQrOnSales
      : documentType === "estimate"
        ? printing.printUpiQrOnEstimates
        : false;
  const qrNeedsDetails = qrIsEnabled && (!printing.upiId.trim() || !printing.upiPayeeName.trim());
  const isRaster = printing.defaultPrintMode === "raster";
  const outputSummary = isRaster
    ? {
        label: "Raster output",
        detail: "576 dots · Inter · GS v 0",
        note: "This is the high-quality image layout sent to the printer."
      }
    : {
        label: "Device text",
        detail: "Font A · 48 columns",
        note: "This is the compatibility layout built by the printer firmware."
      };

  return (
    <>
      <div className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
        <div
          className="border-border bg-muted grid grid-cols-3 gap-1 rounded-(--radius-control) border p-1"
          role="group"
          aria-label="Preview document"
        >
          {PREVIEW_DOCUMENTS.map(({ value, label, icon: Icon }) => {
            const isSelected = documentType === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isSelected}
                className={cn(
                  "focus-visible:ring-ring flex h-8 items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-2px)] px-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  isSelected
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-hover hover:text-foreground"
                )}
                onClick={() => setDocumentType(value)}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 items-center gap-2 md:justify-end">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full",
              isRaster
                ? "bg-counter-accent-soft text-counter-accent-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            <ScanLine className="size-3.5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="text-foreground block text-xs font-semibold">
              {outputSummary.label}
            </span>
            <span className="text-muted-foreground block text-[11px] font-medium tabular-nums">
              {outputSummary.detail}
            </span>
          </span>
        </div>
      </div>

      <div className="bg-primary relative min-h-96 overflow-hidden px-3 pt-5 pb-7 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }}
        />
        <div className="relative mx-auto mb-4 flex max-w-[420px] items-center justify-between gap-3">
          <span className="text-primary-foreground/75 text-[11px] font-semibold tracking-[0.12em] uppercase">
            80 mm paper
          </span>
          <span className="text-primary-foreground/60 text-[11px] font-medium">
            Screen preview · actual print proportions
          </span>
        </div>

        <div className="relative mx-auto w-full max-w-[420px]">
          <div
            className="bg-primary-hover absolute -top-2 left-1/2 h-5 w-[88%] -translate-x-1/2 rounded-t-lg border border-white/10 shadow-lg"
            aria-hidden="true"
          />
          <div className="relative">
            {isRaster ? (
              <ScaledThermalPaper
                extraFeedLines={receipt?.extraFeedLines ?? ledger.extraFeedLines}
                cutMode={receipt?.cutMode ?? ledger.cutMode}
              >
                {receipt ? (
                  <RasterReceiptPaper receipt={receipt} />
                ) : (
                  <RasterLedgerPaper statement={ledger} />
                )}
              </ScaledThermalPaper>
            ) : receipt ? (
              <DeviceTextReceiptPaper receipt={receipt} />
            ) : (
              <DeviceTextLedgerPaper statement={ledger} />
            )}
          </div>
        </div>
      </div>

      <footer className="border-border grid gap-3 border-t px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
        <p className="text-muted-foreground text-xs leading-relaxed">{outputSummary.note}</p>
        {isError || qrNeedsDetails ? (
          <div className="space-y-2">
            {isError ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">Using sample shop details.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isFetching}
                  onClick={() => void refetch()}
                >
                  {isFetching ? <Loader2 className="animate-spin" /> : null}
                  Try Store Profile again
                </Button>
              </div>
            ) : null}
            {qrNeedsDetails ? (
              <div className="border-gold-accent-border bg-gold-accent-soft text-gold-accent-foreground flex gap-2 rounded-(--radius-control) border px-3 py-2 text-xs">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>Add a UPI ID and payee name to show the QR.</p>
              </div>
            ) : null}
          </div>
        ) : (
          <span className="text-muted-foreground text-[11px] font-medium whitespace-nowrap">
            Feed and cut are previewed below the paper
          </span>
        )}
      </footer>
    </>
  );
}

export function ThermalReceiptPreview({ printing }: { printing: PrintingConfig }) {
  return (
    <Dialog>
      <section
        className="border-frame bg-card rounded-(--radius-panel) border px-4 py-3 shadow-xs"
        aria-labelledby="thermal-preview-launch-title"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-(--radius-control)">
            <ReceiptText className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <h2 id="thermal-preview-launch-title" className="text-foreground text-sm font-semibold">
              Receipt preview
            </h2>
            <span className="text-muted-foreground block text-xs">
              Review bills and ledgers before printing.
            </span>
          </span>
          <span className="border-border bg-muted text-muted-foreground hidden shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex">
            {printing.defaultPrintMode === "raster" ? "Raster · 576 dots" : "Text · 48 columns"}
          </span>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Maximize2 className="size-3.5" aria-hidden="true" />
              Open preview
            </Button>
          </DialogTrigger>
        </div>
      </section>

      <DialogContent className="max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-border border-b px-5 py-4 pr-14">
          <DialogTitle>Receipt preview</DialogTitle>
          <DialogDescription>
            Sale, estimate, and ledger samples using your current print settings.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto">
          <ThermalReceiptPreviewContent printing={printing} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
