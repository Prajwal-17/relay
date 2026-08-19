import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useCustomerLedgerSummary } from "@/features/customers/hooks/useCustomerLedger";
import { useAppPreferences } from "@/features/preferences/useAppPreferences";
import { cn } from "@/lib/utils";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { TRANSACTION_TYPE } from "@shared/types";
import {
  getDefaultUpiQrProfile,
  orderUpiQrProfiles,
  resolveUpiQrProfile
} from "@shared/utils/upiQrProfiles";
import { formatRupee } from "@shared/utils/utils";
import { BadgeIndianRupee, IndianRupee, Printer, QrCode } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import {
  buildBillingAccountSettlement,
  getBillingCurrentBillPaisa
} from "./billingAccountSettlement";

type BillOptionProps = {
  id: string;
  label: string;
  icon: ReactNode;
  status?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function BillOption({
  id,
  label,
  icon,
  status,
  checked,
  disabled = false,
  onCheckedChange
}: BillOptionProps) {
  const statusId = status ? id + "-status" : undefined;

  return (
    <label
      htmlFor={id}
      className={cn(
        "hover:bg-hover flex min-h-10 cursor-pointer items-center gap-2 px-2 py-1 transition-colors",
        checked && !disabled && "bg-selected hover:bg-selected",
        disabled && "cursor-not-allowed"
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        aria-label={label}
        aria-describedby={statusId}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="order-3"
      />
      <span
        className={cn(
          "text-muted-foreground flex size-7 shrink-0 items-center justify-center",
          checked && !disabled && "text-foreground"
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "text-foreground block text-sm font-semibold",
            disabled && "text-muted-foreground"
          )}
        >
          {label}
        </span>
        {status ? (
          <span id={statusId} className="text-muted-foreground block text-xs leading-4">
            {status}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function BillingPrintOptions() {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const updatePrintOption = useBillingSessionStore((state) => state.updatePrintOption);
  const { config, defaults } = useAppPreferences();

  const printing = config?.printing ?? defaults?.printing;
  const defaultCustomerId =
    config?.billing.defaultCustomerId ?? defaults?.billing.defaultCustomerId ?? null;

  const storedUpiOption = session?.printOptions.includeUpiQr ?? null;
  const storedAmountOption = session?.printOptions.includeAmountInUpiQr ?? null;
  const storedUpiProfileId = session?.printOptions.selectedUpiQrProfileId ?? null;
  const includeAccountSummary = session?.printOptions.includeAccountSummary ?? false;
  const billingType = session?.billingType;
  const customerId = session?.customerId ?? null;
  const customerName = session?.customerName.trim() ?? "";

  const orderedUpiProfiles = printing ? orderUpiQrProfiles(printing) : [];
  const selectedUpiProfile = printing
    ? (resolveUpiQrProfile(printing, storedUpiProfileId) ?? getDefaultUpiQrProfile(printing))
    : undefined;
  const upiIsReady = Boolean(selectedUpiProfile);
  const defaultUpiQr = printing
    ? billingType === TRANSACTION_TYPE.SALE
      ? printing.printUpiQrOnSales
      : printing.printUpiQrOnEstimates
    : false;
  const includeUpiQr = upiIsReady && (storedUpiOption ?? defaultUpiQr);
  const includeAmountInUpiQr =
    includeUpiQr && (storedAmountOption ?? printing?.includeAmountInUpiQr ?? true);

  const hasNamedCustomer = Boolean(customerId && customerName);
  const isDefaultCustomer = Boolean(
    customerId && (customerId === defaultCustomerId || customerName.toUpperCase() === "DEFAULT")
  );
  const isSale = billingType === TRANSACTION_TYPE.SALE;
  const accountIsAvailable =
    isSale && hasNamedCustomer && !isDefaultCustomer && Boolean(session?.addToAccounting);
  const ledgerCustomerId = accountIsAvailable ? (customerId ?? "") : "";
  const { summary: ledgerSummary } = useCustomerLedgerSummary(ledgerCustomerId);
  const currentBillPaisa = session ? getBillingCurrentBillPaisa(session) : 0;
  const accountSettlement =
    session && ledgerSummary ? buildBillingAccountSettlement(session, ledgerSummary) : null;

  useEffect(() => {
    if (!activeTabId || !session || !printing) return;

    if (
      session.printOptions.selectedUpiQrProfileId &&
      !printing.upiQrProfiles.some(
        (profile) => profile.id === session.printOptions.selectedUpiQrProfileId
      )
    ) {
      updatePrintOption(activeTabId, "selectedUpiQrProfileId", null);
    }
    if (!upiIsReady) {
      if (session.printOptions.includeUpiQr !== false) {
        updatePrintOption(activeTabId, "includeUpiQr", false);
      }
      if (session.printOptions.includeAmountInUpiQr !== false) {
        updatePrintOption(activeTabId, "includeAmountInUpiQr", false);
      }
    }
  }, [activeTabId, printing, session, updatePrintOption, upiIsReady]);

  useEffect(() => {
    if (!activeTabId || !session || accountIsAvailable) return;
    if (session.printOptions.includeAccountSummary) {
      updatePrintOption(activeTabId, "includeAccountSummary", false);
    }
  }, [accountIsAvailable, activeTabId, session, updatePrintOption]);

  if (!activeTabId || !session) return null;

  const upiStatus = !printing ? "Loading…" : !upiIsReady ? "Add a UPI account first" : undefined;
  const amountStatus = !printing ? "Loading…" : !upiIsReady ? "UPI unavailable" : undefined;
  const accountStatus = !isSale
    ? "Sales only"
    : !hasNamedCustomer || isDefaultCustomer
      ? "Account customer required"
      : !session.addToAccounting
        ? "Use Add to account first"
        : undefined;

  const handleUpiQrChange = (checked: boolean) => {
    updatePrintOption(activeTabId, "includeUpiQr", checked);
    if (!checked) updatePrintOption(activeTabId, "includeAmountInUpiQr", false);
  };

  const handleExactAmountChange = (checked: boolean) => {
    updatePrintOption(activeTabId, "includeAmountInUpiQr", checked);
    if (checked && !includeUpiQr) updatePrintOption(activeTabId, "includeUpiQr", true);
  };

  const handleUpiProfileChange = (profileId: string) => {
    updatePrintOption(activeTabId, "selectedUpiQrProfileId", profileId);
    updatePrintOption(activeTabId, "includeUpiQr", true);
  };

  const handleAccountSummaryChange = (checked: boolean) => {
    updatePrintOption(activeTabId, "includeAccountSummary", checked);
  };

  return (
    <section aria-labelledby="billing-options-title">
      <fieldset>
        <legend className="sr-only">Bill options</legend>

        <div className="border-frame flex h-8 items-center gap-2 border-b px-2">
          <Printer className="text-muted-foreground size-4" aria-hidden="true" />
          <span id="billing-options-title" className="text-foreground text-sm font-semibold">
            Bill options
          </span>
        </div>

        <div className="divide-border divide-y">
          <BillOption
            id="billing-print-upi-qr"
            label="UPI payment QR"
            icon={<QrCode className="size-4" />}
            status={upiStatus}
            checked={includeUpiQr}
            disabled={!printing || !upiIsReady}
            onCheckedChange={handleUpiQrChange}
          />
          {includeUpiQr && selectedUpiProfile ? (
            <div className="px-2 py-2">
              <span
                id="billing-upi-profile-label"
                className="text-muted-foreground block text-xs font-medium"
              >
                Payment account
              </span>
              <Select value={selectedUpiProfile.id} onValueChange={handleUpiProfileChange}>
                <SelectTrigger
                  id="billing-upi-profile"
                  aria-labelledby="billing-upi-profile-label"
                  className="mt-1 h-11 w-full min-w-0 px-2.5 py-1 text-left"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-(--radius-control)">
                      <QrCode className="size-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="text-foreground block truncate text-xs font-semibold"
                        title={selectedUpiProfile.label}
                      >
                        {selectedUpiProfile.label}
                      </span>
                      <span
                        className="text-muted-foreground block truncate text-xs"
                        title={selectedUpiProfile.upiId}
                      >
                        {selectedUpiProfile.upiId}
                        {selectedUpiProfile.id === printing?.defaultUpiQrProfileId
                          ? " · Default"
                          : ""}
                      </span>
                    </span>
                  </span>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  className="w-[var(--radix-select-trigger-width)] min-w-0"
                >
                  {orderedUpiProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id} className="min-w-0 py-2">
                      <span className="min-w-0">
                        <span className="text-foreground block truncate text-xs font-semibold">
                          {profile.label}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {profile.upiId}
                          {profile.id === printing?.defaultUpiQrProfileId ? " · Default" : ""}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <BillOption
            id="billing-print-upi-amount"
            label="Use exact bill total"
            icon={<IndianRupee className="size-4" />}
            status={amountStatus}
            checked={includeAmountInUpiQr}
            disabled={!printing || !upiIsReady}
            onCheckedChange={handleExactAmountChange}
          />
          <BillOption
            id="billing-print-account-summary"
            label="Balance summary"
            icon={<BadgeIndianRupee className="size-4" />}
            status={accountStatus}
            checked={includeAccountSummary && accountIsAvailable}
            disabled={!accountIsAvailable}
            onCheckedChange={handleAccountSummaryChange}
          />
          {includeAccountSummary && accountIsAvailable ? (
            <div className="space-y-0.5 px-2 py-1.5" aria-live="polite">
              <div className="text-muted-foreground flex min-h-7 items-center justify-between gap-3 text-xs">
                <span>Previous balance</span>
                <span className="text-foreground font-medium tabular-nums">
                  {accountSettlement ? formatRupee(accountSettlement.previousBalancePaisa) : "—"}
                </span>
              </div>
              <div className="text-muted-foreground flex min-h-7 items-center justify-between gap-3 text-xs">
                <span>Current bill (+)</span>
                <span className="text-foreground font-medium tabular-nums">
                  {formatRupee(accountSettlement?.currentBillPaisa ?? currentBillPaisa)}
                </span>
              </div>
              {accountSettlement && accountSettlement.paymentPaisa > 0 ? (
                <div className="text-muted-foreground flex min-h-7 items-center justify-between gap-3 text-xs">
                  <span>Payment (-)</span>
                  <span className="text-foreground font-medium tabular-nums">
                    {formatRupee(accountSettlement.paymentPaisa)}
                  </span>
                </div>
              ) : null}
              <div className="border-frame flex min-h-9 items-center justify-between gap-3 border-t text-sm">
                <span className="text-foreground font-semibold">Balance</span>
                <span className="text-foreground font-bold tabular-nums">
                  {accountSettlement ? formatRupee(accountSettlement.balancePaisa) : "—"}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </fieldset>
    </section>
  );
}
