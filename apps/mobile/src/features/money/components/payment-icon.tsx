import { Banknote, QrCode, Store, WalletCards } from "lucide-react-native";
import { Image, View } from "react-native";

import { cn } from "@/lib/utils";
import { usePalette } from "@/theme/palette";

const PAYTM = require("../../../../assets/payment-methods/paytm.png");
const PHONEPE = require("../../../../assets/payment-methods/phonepe.png");

export function PaymentIcon({
  name,
  kind = "upi"
}: {
  name?: string;
  kind?: "cash" | "upi" | "vendor";
}) {
  const colors = usePalette();
  const provider = name?.trim().toLowerCase();
  const image = provider === "paytm" ? PAYTM : provider === "phonepe" ? PHONEPE : null;
  const Icon =
    kind === "cash"
      ? Banknote
      : kind === "vendor"
        ? Store
        : provider === "google pay"
          ? WalletCards
          : QrCode;

  return (
    <View
      accessible={false}
      className={cn(
        "rounded-control h-10 w-10 shrink-0 items-center justify-center overflow-hidden",
        kind === "cash"
          ? "bg-sales-soft"
          : kind === "vendor"
            ? "bg-accent-soft"
            : "bg-surface-muted"
      )}
    >
      {image && kind === "upi" ? (
        <Image className="h-[22px] w-8" source={image} resizeMode="contain" />
      ) : (
        <Icon
          size={20}
          strokeWidth={1.8}
          color={
            kind === "cash"
              ? colors["sales-ink"]
              : kind === "vendor"
                ? colors["accent-ink"]
                : colors.primary
          }
        />
      )}
    </View>
  );
}
