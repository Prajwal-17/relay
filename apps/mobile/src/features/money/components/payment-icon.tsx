import { Banknote, QrCode, Store } from "lucide-react-native";
import { Image, View } from "react-native";

import { cn } from "@/lib/utils";
import { usePalette } from "@/theme/palette";

const PAYTM = require("../../../../assets/payment-methods/paytm.png");
const PHONEPE = require("../../../../assets/payment-methods/phonepe.png");
const GOOGLE_PAY = require("../../../../assets/payment-methods/google-pay.png");

export function PaymentIcon({
  name,
  kind = "upi"
}: {
  name?: string;
  kind?: "cash" | "upi" | "vendor";
}) {
  const colors = usePalette();
  const provider = name?.trim().toLowerCase();
  const image =
    provider === "paytm"
      ? PAYTM
      : provider === "phonepe"
        ? PHONEPE
        : provider === "google pay"
          ? GOOGLE_PAY
          : null;
  const Icon = kind === "cash" ? Banknote : kind === "vendor" ? Store : QrCode;

  return (
    <View accessible={false} className="h-10 w-14 shrink-0 items-center justify-center">
      {image && kind === "upi" ? (
        <Image
          className={image === GOOGLE_PAY ? "h-6 w-10" : "h-6 w-11"}
          source={image}
          resizeMode="contain"
        />
      ) : (
        <View
          className={cn(
            "rounded-control h-10 w-10 items-center justify-center",
            kind === "cash"
              ? "bg-sales-soft"
              : kind === "vendor"
                ? "bg-counter-accent-soft"
                : "bg-muted"
          )}
        >
          <Icon
            size={20}
            strokeWidth={1.8}
            color={
              kind === "cash"
                ? colors["sales-ink"]
                : kind === "vendor"
                  ? colors["counter-accent-foreground"]
                  : colors.primary
            }
          />
        </View>
      )}
    </View>
  );
}
