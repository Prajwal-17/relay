import { ErrorState } from "@/components/app-ui/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppPreferences } from "@/features/preferences/useAppPreferences";
import { cn } from "@/lib/utils";
import type { PrintingConfig } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LockKeyhole, RefreshCw, ScanLine, Type } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SettingsField } from "../SettingsField";
import { SettingsSection } from "../SettingsSection";
import { ThermalReceiptPreview } from "../ThermalReceiptPreview";

const RESETTABLE_FIELDS_COUNT = 16;
const inputClass = "text-sm font-medium";

type TextPrintingField = "footerMessage" | "upiId" | "upiPayeeName";

const TEXT_FIELD_LABELS: Record<TextPrintingField, string> = {
  footerMessage: "Footer message",
  upiId: "UPI ID",
  upiPayeeName: "UPI payee name"
};

function SavedTextInput({
  id,
  field,
  value,
  disabled,
  placeholder,
  onCommit
}: {
  id: string;
  field: TextPrintingField;
  value: string;
  disabled: boolean;
  placeholder?: string;
  onCommit: (field: TextPrintingField, value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => setLocalValue(value), [value]);

  const commit = () => {
    const normalized = localValue.trim();
    if (normalized !== value) onCommit(field, normalized);
  };

  return (
    <Input
      id={id}
      aria-label={TEXT_FIELD_LABELS[field]}
      className={inputClass}
      value={localValue}
      placeholder={placeholder}
      onChange={(event) => setLocalValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      disabled={disabled}
      autoComplete="off"
    />
  );
}

function ToggleField({
  id,
  label,
  hint,
  checked,
  disabled,
  onCheckedChange
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <SettingsField label={label} hint={hint}>
      <div className="flex h-9 items-center">
        <Switch
          id={id}
          aria-label={label}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </SettingsField>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  const headingId = `printing-${title.toLowerCase().replaceAll(/[^a-z]+/g, "-")}`;

  return (
    <section aria-labelledby={headingId}>
      <header className="py-3">
        <h3 id={headingId} className="text-foreground text-sm font-semibold">
          {title}
        </h3>
      </header>
      <div className="divide-border divide-y">{children}</div>
    </section>
  );
}

function FixedSetting({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <SettingsField label={label} hint={hint}>
      <div className="border-border bg-muted text-foreground flex min-h-9 items-center gap-2 rounded-(--radius-control) border px-3 text-sm font-medium">
        <LockKeyhole className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
        <span>{value}</span>
      </div>
    </SettingsField>
  );
}

export const PrintingSection = () => {
  const {
    config,
    isLoading,
    isError,
    refetch,
    isFetching,
    updateConfig,
    resetSection,
    isUpdating,
    isResetting
  } = useAppPreferences();

  const {
    data: printers = [],
    isLoading: arePrintersLoading,
    isError: isPrintersError,
    error: printersError,
    refetch: refetchPrinters,
    isFetching: arePrintersFetching
  } = useQuery({
    queryKey: ["systemPrinters"],
    queryFn: async () => {
      const response = await window.rawPrintApi.listPrinters();
      if (response.status === "error") throw new Error(response.error.message);
      return response.data;
    },
    retry: false
  });

  const printing = config?.printing;
  const selectedPrinterIsUnavailable = useMemo(
    () =>
      Boolean(
        printing?.printerName && !printers.some((printer) => printer.name === printing.printerName)
      ),
    [printers, printing?.printerName]
  );

  if (isError) {
    return (
      <SettingsSection title="Printing">
        <ErrorState
          layout="panel"
          className="rounded-none border-0"
          title="Printing preferences could not be loaded"
          description="Try loading this section again."
          primaryAction={{ label: "Try again", onClick: () => void refetch(), loading: isFetching }}
        />
      </SettingsSection>
    );
  }

  if (isLoading || !printing) {
    return (
      <SettingsSection title="Printing">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      </SettingsSection>
    );
  }

  const updatePrinting = (partial: Partial<PrintingConfig>) => {
    updateConfig({ printing: partial });
  };

  return (
    <div className="space-y-3">
      <ThermalReceiptPreview printing={printing} />
      <SettingsSection
        title="Printing"
        description="Printer, paper, and receipt options."
        resettableFieldsCount={RESETTABLE_FIELDS_COUNT}
        onResetSection={() => resetSection("printing")}
        isResetting={isResetting}
      >
        <Tabs defaultValue="printer" className="py-3">
          <TabsList
            className="h-8 w-fit max-w-full self-start overflow-x-auto"
            aria-label="Printing settings categories"
          >
            <TabsTrigger value="printer">Printer</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="upi">UPI QR</TabsTrigger>
          </TabsList>

          <TabsContent value="printer" className="mt-0">
            <SettingsGroup title="Printer">
              <SettingsField label="Windows printer" hint="Choose an installed printer.">
                <div className="flex items-start gap-2">
                  <Select
                    value={printing.printerName || undefined}
                    onValueChange={(printerName) => updatePrinting({ printerName })}
                    disabled={isUpdating || arePrintersLoading || isPrintersError}
                  >
                    <SelectTrigger
                      id="settings-printer"
                      aria-label="Windows printer"
                      className="w-full text-sm"
                    >
                      <SelectValue
                        placeholder={arePrintersLoading ? "Loading printers…" : "Select a printer"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPrinterIsUnavailable ? (
                        <SelectItem value={printing.printerName}>
                          {printing.printerName} (unavailable)
                        </SelectItem>
                      ) : null}
                      {printers.map((printer) => (
                        <SelectItem key={printer.name} value={printer.name}>
                          {printer.displayName || printer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Refresh Windows printers"
                    title="Refresh Windows printers"
                    onClick={() => void refetchPrinters()}
                    disabled={arePrintersFetching || isUpdating}
                  >
                    <RefreshCw className={arePrintersFetching ? "animate-spin" : undefined} />
                  </Button>
                </div>
                {isPrintersError ? (
                  <p className="text-destructive text-xs" role="alert">
                    {printersError instanceof Error
                      ? printersError.message
                      : "Windows printers could not be loaded."}
                  </p>
                ) : null}
              </SettingsField>
              <SettingsField label="Print quality" hint="Choose the receipt output.">
                <div
                  className="grid gap-2 sm:grid-cols-2"
                  role="radiogroup"
                  aria-label="Print quality"
                >
                  {(
                    [
                      {
                        value: "raster",
                        label: "Raster quality",
                        description: "Sharp 576-dot Inter text",
                        icon: ScanLine
                      },
                      {
                        value: "device-text",
                        label: "Device text",
                        description: "Fast Font A compatibility",
                        icon: Type
                      }
                    ] as const
                  ).map((option) => {
                    const Icon = option.icon;
                    const isSelected = printing.defaultPrintMode === option.value;

                    return (
                      <label
                        key={option.value}
                        className={cn(
                          "focus-within:ring-ring flex min-h-20 cursor-pointer items-center gap-3 rounded-(--radius-control) border px-3 text-left transition-colors focus-within:ring-2 focus-within:outline-none",
                          isSelected
                            ? "border-strong bg-muted"
                            : "border-border bg-card hover:bg-hover",
                          isUpdating && "pointer-events-none opacity-50"
                        )}
                      >
                        <input
                          type="radio"
                          name="default-print-quality"
                          value={option.value}
                          checked={isSelected}
                          disabled={isUpdating}
                          className="sr-only"
                          onChange={() => updatePrinting({ defaultPrintMode: option.value })}
                        />
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-(--radius-control)",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="text-foreground block text-sm font-semibold">
                            {option.label}
                          </span>
                          <span className="text-muted-foreground mt-0.5 block text-xs leading-4">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-muted-foreground text-xs">
                  Raster jobs are larger and may print slightly slower.
                </p>
              </SettingsField>
              <FixedSetting
                label="Paper"
                hint="Fixed thermal format."
                value={
                  printing.defaultPrintMode === "raster"
                    ? "80 mm · 576 dots · GS v 0"
                    : "80 mm · Font A · 48 columns"
                }
              />
            </SettingsGroup>

            <SettingsGroup title="Paper cut">
              <SettingsField label="Blank lines at end" hint="Adds space before the paper is cut.">
                <Select
                  value={String(printing.extraFeedLines)}
                  onValueChange={(value) => updatePrinting({ extraFeedLines: Number(value) })}
                  disabled={isUpdating}
                >
                  <SelectTrigger id="settings-print-feed-lines" aria-label="Blank lines at end">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value === 0
                          ? "No extra lines"
                          : `${value} ${value === 1 ? "line" : "lines"}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingsField>

              <SettingsField label="Cut type" hint="Choose partial, full, or no cut.">
                <Select
                  value={printing.cutMode}
                  onValueChange={(cutMode) =>
                    updatePrinting({ cutMode: cutMode as PrintingConfig["cutMode"] })
                  }
                  disabled={isUpdating}
                >
                  <SelectTrigger id="settings-print-cut-mode" aria-label="Cut type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partial">Partial cut</SelectItem>
                    <SelectItem value="full">Full cut</SelectItem>
                    <SelectItem value="none">No cut</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>
            </SettingsGroup>
          </TabsContent>

          <TabsContent value="bills" className="mt-0">
            <SettingsGroup title="Bill details">
              <ToggleField
                id="settings-print-address"
                label="Show address"
                hint="Uses the address in Store Profile."
                checked={printing.showAddress}
                disabled={isUpdating}
                onCheckedChange={(showAddress) => updatePrinting({ showAddress })}
              />
              <ToggleField
                id="settings-print-phone"
                label="Show phone"
                hint="Uses the phone number in Store Profile."
                checked={printing.showPhone}
                disabled={isUpdating}
                onCheckedChange={(showPhone) => updatePrinting({ showPhone })}
              />
              <ToggleField
                id="settings-print-gstin"
                label="Show GSTIN on sales"
                hint="Sales only. Estimates never show GSTIN."
                checked={printing.showGstinOnSales}
                disabled={isUpdating}
                onCheckedChange={(showGstinOnSales) => updatePrinting({ showGstinOnSales })}
              />
              <ToggleField
                id="settings-print-customer-name"
                label="Show customer name"
                hint="Shows the selected customer on the bill."
                checked={printing.showCustomerName}
                disabled={isUpdating}
                onCheckedChange={(showCustomerName) => updatePrinting({ showCustomerName })}
              />
              <ToggleField
                id="settings-print-savings"
                label="Show savings"
                hint="Shows how much the customer saved from MRP."
                checked={printing.showSavings}
                disabled={isUpdating}
                onCheckedChange={(showSavings) => updatePrinting({ showSavings })}
              />
              <SettingsField label="Minimum savings" hint="Print only at or above this amount.">
                <Select
                  value={String(printing.savingsThresholdPaisa)}
                  onValueChange={(value) =>
                    updatePrinting({ savingsThresholdPaisa: Number(value) })
                  }
                  disabled={isUpdating || !printing.showSavings}
                >
                  <SelectTrigger id="settings-print-savings-threshold" aria-label="Minimum savings">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Always</SelectItem>
                    <SelectItem value="1000">₹10 or more</SelectItem>
                    <SelectItem value="2000">₹20 or more</SelectItem>
                    <SelectItem value="5000">₹50 or more</SelectItem>
                    <SelectItem value="10000">₹100 or more</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsField>

              <SettingsField label="Footer" hint="Printed at the bottom.">
                <SavedTextInput
                  id="settings-print-footer"
                  field="footerMessage"
                  value={printing.footerMessage}
                  disabled={isUpdating}
                  placeholder="Thank you. Visit again."
                  onCommit={(field, value) => updatePrinting({ [field]: value })}
                />
              </SettingsField>
            </SettingsGroup>
          </TabsContent>

          <TabsContent value="upi" className="mt-0">
            <SettingsGroup title="UPI QR">
              <FixedSetting
                label="QR type"
                hint="Fixed for reliable scanning."
                value="Module size 6 · error correction M"
              />
              <SettingsField label="UPI ID" hint="Example: shop@bank.">
                <SavedTextInput
                  id="settings-print-upi-id"
                  field="upiId"
                  value={printing.upiId}
                  disabled={isUpdating}
                  placeholder="shop@bank"
                  onCommit={(field, value) => updatePrinting({ [field]: value })}
                />
              </SettingsField>

              <SettingsField label="UPI payee name" hint="Shown below the QR and in the UPI app.">
                <SavedTextInput
                  id="settings-print-upi-payee"
                  field="upiPayeeName"
                  value={printing.upiPayeeName}
                  disabled={isUpdating}
                  placeholder="Your store name"
                  onCommit={(field, value) => updatePrinting({ [field]: value })}
                />
              </SettingsField>

              <ToggleField
                id="settings-print-upi-sales"
                label="Print UPI QR on sales"
                hint="Shows a QR on sales bills."
                checked={printing.printUpiQrOnSales}
                disabled={isUpdating}
                onCheckedChange={(printUpiQrOnSales) => updatePrinting({ printUpiQrOnSales })}
              />
              <ToggleField
                id="settings-print-upi-estimates"
                label="Print UPI QR on estimates"
                hint="Shows a QR on estimates."
                checked={printing.printUpiQrOnEstimates}
                disabled={isUpdating}
                onCheckedChange={(printUpiQrOnEstimates) =>
                  updatePrinting({ printUpiQrOnEstimates })
                }
              />
              <ToggleField
                id="settings-print-upi-amount"
                label="Include exact bill amount"
                hint="Adds the exact total to the payment request."
                checked={printing.includeAmountInUpiQr}
                disabled={isUpdating}
                onCheckedChange={(includeAmountInUpiQr) => updatePrinting({ includeAmountInUpiQr })}
              />
            </SettingsGroup>
          </TabsContent>
        </Tabs>
      </SettingsSection>
    </div>
  );
};
