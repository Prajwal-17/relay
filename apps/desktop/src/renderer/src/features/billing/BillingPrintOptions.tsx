import { Checkbox } from "@/components/ui/checkbox";
import { UpiAccountPicker } from "@/components/app-ui/UpiAccountPicker";
import {
  ReceiptQrModeSelector,
  type ReceiptQrMode
} from "@/features/billing/ReceiptQrModeSelector";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { useCustomerLedgerSummary } from "@/features/customers/hooks/useCustomerLedger";
import { useAppPreferences } from "@/features/preferences/useAppPreferences";
import { cn } from "@/lib/utils";
import { TRANSACTION_TYPE } from "@shared/types";
import {
  getDefaultUpiQrProfile,
  orderUpiQrProfiles,
  resolveUpiQrProfile
} from "@shared/utils/upiQrProfiles";
import { formatRupee } from "@shared/utils/utils";
import { BadgeIndianRupee } from "lucide-react";
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
  const receiptQrMode: ReceiptQrMode = !includeUpiQr
    ? "receipt"
    : includeAmountInUpiQr
      ? "upi-exact"
      : "upi-open";

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

  const accountStatus = !isSale
    ? "Sales only"
    : !hasNamedCustomer || isDefaultCustomer
      ? "Account customer required"
      : !session.addToAccounting
        ? "Use Add to account first"
        : undefined;

  const handleReceiptQrModeChange = (mode: ReceiptQrMode) => {
    updatePrintOption(activeTabId, "includeUpiQr", mode !== "receipt");
    updatePrintOption(activeTabId, "includeAmountInUpiQr", mode === "upi-exact");
  };

  const handleUpiProfileChange = (profileId: string) => {
    updatePrintOption(activeTabId, "selectedUpiQrProfileId", profileId);
    updatePrintOption(activeTabId, "includeUpiQr", true);
  };

  const handleAccountSummaryChange = (checked: boolean) => {
    updatePrintOption(activeTabId, "includeAccountSummary", checked);
  };

  return (
    <section aria-label="Bill options" className="min-w-0">
      <fieldset className="min-w-0">
        <legend className="sr-only">Bill options</legend>

        <div className="divide-border divide-y">
          <div className="space-y-2 px-2 py-2.5">
            <ReceiptQrModeSelector
              id={`billing-print-mode-${activeTabId}`}
              mode={receiptQrMode}
              totalPaisa={currentBillPaisa}
              upiDisabled={!printing || !upiIsReady}
              density="compact"
              onModeChange={handleReceiptQrModeChange}
            />
            {!printing || !upiIsReady ? (
              <p className="text-muted-foreground text-xs">
                {!printing
                  ? "Loading print settings…"
                  : "Add a UPI account in Settings → Printing."}
              </p>
            ) : null}
            {includeUpiQr && selectedUpiProfile ? (
              <div className="border-border min-w-0 rounded-(--radius-panel) border p-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span
                    id="billing-upi-profile-label"
                    className="text-foreground text-sm font-medium"
                  >
                    UPI account
                  </span>
                  {orderedUpiProfiles.length > 1 ? (
                    <span className="text-muted-foreground text-xs">
                      {orderedUpiProfiles.length} saved
                    </span>
                  ) : null}
                </div>
                <UpiAccountPicker
                  id="billing-upi-profile"
                  aria-labelledby="billing-upi-profile-label"
                  profiles={orderedUpiProfiles}
                  selectedProfileId={selectedUpiProfile.id}
                  defaultProfileId={printing?.defaultUpiQrProfileId}
                  onProfileChange={handleUpiProfileChange}
                  showListDetails={false}
                  variant="inline"
                />
              </div>
            ) : null}
          </div>
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
