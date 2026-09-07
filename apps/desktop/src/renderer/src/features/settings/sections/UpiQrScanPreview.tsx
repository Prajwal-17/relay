import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UpiQrProfile } from "@shared/types";
import { buildUpiPaymentUri } from "@shared/utils/upiQrProfiles";
import { formatRupee, rupeesToPaisa } from "@shared/utils/utils";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

type ScanMode = "open" | "fixed";

function ScanCode({
  profile,
  value,
  amountLabel,
  testId
}: {
  profile: UpiQrProfile;
  value: string;
  amountLabel: string;
  testId: string;
}) {
  return (
    <div className="space-y-3 pt-2">
      <div
        className="border-border mx-auto flex size-48 max-w-full items-center justify-center border bg-white p-1"
        data-testid={testId}
        data-qr-value={value}
      >
        <QRCodeSVG
          value={value}
          level="M"
          boostLevel={false}
          marginSize={3}
          size={184}
          bgColor="#ffffff"
          fgColor="#000000"
          title={`${profile.label} UPI scan test`}
          className="size-full"
        />
      </div>
      <dl className="divide-border min-w-0 divide-y text-xs">
        <div className="grid min-h-7 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-1">
          <dt className="text-muted-foreground">UPI ID</dt>
          <dd
            className="text-foreground min-w-0 text-right font-medium break-all"
            title={profile.upiId}
          >
            {profile.upiId}
          </dd>
        </div>
        <div className="grid min-h-7 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-1">
          <dt className="text-muted-foreground">Payee</dt>
          <dd
            className="text-foreground min-w-0 text-right font-medium [overflow-wrap:anywhere]"
            title={profile.payeeName}
          >
            {profile.payeeName}
          </dd>
        </div>
        <div className="grid min-h-7 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-1">
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="text-foreground min-w-0 text-right font-medium">{amountLabel}</dd>
        </div>
      </dl>
    </div>
  );
}

export function UpiQrScanPreview({ profile }: { profile: UpiQrProfile }) {
  const [mode, setMode] = useState<ScanMode>("open");
  const [testAmount, setTestAmount] = useState("1");

  const rupees = Number(testAmount);
  const fixedAmountPaisa =
    Number.isFinite(rupees) && rupees > 0 ? rupeesToPaisa(rupees) : undefined;
  const baseInput = {
    upiId: profile.upiId,
    payeeName: profile.payeeName,
    transactionRef: "RELAY-TEST",
    note: "Relay QR scan test"
  };
  const openAmountUri = buildUpiPaymentUri(baseInput);
  const fixedAmountUri = fixedAmountPaisa
    ? buildUpiPaymentUri({ ...baseInput, amountPaisa: fixedAmountPaisa })
    : undefined;

  return (
    <div className="min-w-0">
      <Tabs value={mode} onValueChange={(value) => setMode(value as ScanMode)}>
        <TabsList className="h-8 w-full" aria-label="QR test amount">
          <TabsTrigger value="open" className="min-w-0 px-2 text-xs">
            No amount
          </TabsTrigger>
          <TabsTrigger value="fixed" className="min-w-0 px-2 text-xs">
            Fixed amount
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-0">
          <ScanCode
            profile={profile}
            value={openAmountUri}
            amountLabel="Entered in app"
            testId="upi-open-amount-qr"
          />
        </TabsContent>

        <TabsContent value="fixed" className="mt-0 space-y-2 pt-2">
          <label className="flex min-h-8 items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground font-medium">Test amount</span>
            <span className="border-input bg-background focus-within:border-ring focus-within:ring-ring flex h-8 w-28 items-center rounded-(--radius-control) border focus-within:ring-2">
              <span className="text-muted-foreground pl-2 font-semibold" aria-hidden="true">
                ₹
              </span>
              <Input
                aria-label="Test amount"
                type="number"
                min="0.01"
                step="0.01"
                value={testAmount}
                onChange={(event) => setTestAmount(event.target.value)}
                className="h-full min-w-0 border-0 bg-transparent px-1.5 text-right text-xs shadow-none focus-visible:ring-0"
              />
            </span>
          </label>
          {fixedAmountUri ? (
            <ScanCode
              profile={profile}
              value={fixedAmountUri}
              amountLabel={formatRupee(fixedAmountPaisa ?? 0)}
              testId="upi-fixed-amount-qr"
            />
          ) : (
            <p className="text-destructive py-6 text-center text-xs" role="alert">
              Enter an amount above ₹0.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
