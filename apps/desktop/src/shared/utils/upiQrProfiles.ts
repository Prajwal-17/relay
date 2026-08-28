import type { PrintingConfig, UpiQrProfile } from "../types";

type UpiPaymentUriInput = {
  upiId: string;
  payeeName: string;
  transactionRef: string | number;
  note: string;
  amountPaisa?: number;
};

export function buildUpiPaymentUri({
  upiId,
  payeeName,
  transactionRef,
  note,
  amountPaisa
}: UpiPaymentUriInput): string {
  const id = upiId.trim();
  const name = payeeName.trim();
  if (!id || !name) {
    throw new Error("UPI ID and payee name are required when the payment QR is enabled.");
  }

  const params = [
    `pa=${encodeURIComponent(id)}`,
    `pn=${encodeURIComponent(name)}`,
    "cu=INR",
    `tr=${encodeURIComponent(transactionRef)}`,
    `tn=${encodeURIComponent(note)}`
  ];
  if (amountPaisa !== undefined) params.push(`am=${(amountPaisa / 100).toFixed(2)}`);

  return `upi://pay?${params.join("&")}`;
}

export function getDefaultUpiQrProfile(printing: PrintingConfig): UpiQrProfile | undefined {
  return (
    printing.upiQrProfiles.find((profile) => profile.id === printing.defaultUpiQrProfileId) ??
    printing.upiQrProfiles[0]
  );
}

export function resolveUpiQrProfile(
  printing: PrintingConfig,
  selectedProfileId?: string | null
): UpiQrProfile | undefined {
  return selectedProfileId
    ? printing.upiQrProfiles.find((profile) => profile.id === selectedProfileId)
    : getDefaultUpiQrProfile(printing);
}

export function orderUpiQrProfiles(printing: PrintingConfig): UpiQrProfile[] {
  const defaultProfile = getDefaultUpiQrProfile(printing);
  if (!defaultProfile) return [];

  return [
    defaultProfile,
    ...printing.upiQrProfiles.filter((profile) => profile.id !== defaultProfile.id)
  ];
}
