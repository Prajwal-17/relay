import { ChevronRight } from "lucide-react-native";
import { View, useWindowDimensions } from "react-native";

import { LedgerCard } from "@/components/ui/ledger-card";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { cn } from "@/lib/utils";
import { usePalette } from "@/theme/palette";
import type { DailyEntry, MoneyDay, PaymentMethod } from "../money.types";
import { ENTRY_PROVIDERS } from "../payment-catalog";
import { MoneyAmount } from "./money-amount";
import { PaymentIcon } from "./payment-icon";

function ReceivedMethodRow({
  name,
  id,
  amount,
  count,
  disabled,
  separated,
  compact = false,
  onOpen
}: {
  name: string;
  id: number | null;
  amount: number;
  count?: number;
  disabled: boolean;
  separated: boolean;
  compact?: boolean;
  onOpen: (id: number | null) => void;
}) {
  const colors = usePalette();
  const { width, fontScale } = useWindowDimensions();
  const stack =
    compact ||
    fontScale > 1.3 ||
    formatRupee(amount).length * 9 * fontScale > Math.min(width - 32, 576) - 222;
  return (
    <Pressable
      testID={`received-method-${id === null ? "cash" : id > 0 ? id : name.toLowerCase()}`}
      accessibilityLabel={`${name}, ${formatRupee(amount)}. View entry history`}
      accessibilityHint="Opens this payment method's entries"
      disabled={disabled}
      onPress={() => onOpen(id)}
      className={cn(
        "min-h-16 gap-2 px-3 py-3",
        compact && "min-h-24",
        separated && "border-border border-t"
      )}
    >
      <View className={cn("flex-row items-center", compact ? "gap-2" : "gap-3")}>
        <PaymentIcon kind={id === null ? "cash" : "upi"} name={name} compact />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text
            className={cn("text-foreground font-semibold", compact ? "text-[13px]" : "text-[15px]")}
            numberOfLines={1}
          >
            {name}
          </Text>
          {count !== undefined ? (
            <Text className="text-muted-foreground text-[11px]">
              {count} {count === 1 ? "entry" : "entries"}
            </Text>
          ) : null}
        </View>
        {!stack ? <MoneyAmount amount={amount} /> : null}
        {!compact ? (
          <ChevronRight color={colors["muted-foreground"]} size={16} strokeWidth={1.8} />
        ) : null}
      </View>
      {stack ? (
        <View className={compact ? "items-start" : "items-end"}>
          <MoneyAmount amount={amount} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function ReceivedMethods({
  entry,
  paymentMethods,
  receivedCounts,
  onOpen,
  disabled
}: {
  entry: DailyEntry | null;
  paymentMethods: PaymentMethod[];
  receivedCounts: MoneyDay["receivedCounts"] | undefined;
  onOpen: (paymentMethodId: number | null) => void;
  disabled: boolean;
}) {
  const { width, fontScale } = useWindowDimensions();
  const methods = ENTRY_PROVIDERS.map((name) => {
    const matches = paymentMethods.filter(
      (method) => method.name.trim().toLowerCase() === name.toLowerCase()
    );
    return { name, method: matches.find((method) => !method.isArchived) ?? matches[0] };
  });
  const displayedIds = new Set(methods.map(({ method }) => method?.id));
  const earlier =
    entry?.paymentTotals.filter((total) => !displayedIds.has(total.paymentMethodId)) ?? [];
  const count = (id: number | null) =>
    receivedCounts
      ? (receivedCounts.find((row) => row.paymentMethodId === id)?.count ?? 0)
      : undefined;
  const amountFor = (id?: number) =>
    entry?.paymentTotals.find((row) => row.paymentMethodId === id)?.amount ?? 0;
  const stackProviders =
    fontScale > 1.3 ||
    methods.some(
      ({ method }) =>
        formatRupee(amountFor(method?.id)).length * 9 * fontScale >
        (Math.min(width - 32, 576) - 2) / 2 - 24
    );
  return (
    <View className="gap-2" testID="received-methods">
      <Text accessibilityRole="header" className="text-foreground text-[15px] font-semibold">
        Received
      </Text>
      <LedgerCard className="border-frame">
        <ReceivedMethodRow
          name="Cash"
          id={null}
          amount={entry?.cashAmount ?? 0}
          count={count(null)}
          disabled={disabled}
          separated={false}
          onOpen={onOpen}
        />
        <View className={cn("border-border border-t", !stackProviders && "flex-row")}>
          {methods.map(({ name, method }, index) => (
            <View
              key={name}
              className={cn(
                "min-w-0",
                !stackProviders && "flex-1",
                index > 0 && "border-border",
                index > 0 && (stackProviders ? "border-t" : "border-l")
              )}
            >
              <ReceivedMethodRow
                name={name}
                id={method?.id ?? -1}
                amount={amountFor(method?.id)}
                count={method ? count(method.id) : undefined}
                disabled={disabled || !method}
                separated={false}
                compact={!stackProviders}
                onOpen={onOpen}
              />
            </View>
          ))}
        </View>
      </LedgerCard>
      {earlier.length ? (
        <View className="mt-2 gap-2">
          <Text
            accessibilityRole="header"
            className="text-muted-foreground text-[13px] font-semibold"
          >
            Earlier payment methods
          </Text>
          <LedgerCard>
            {earlier.map((method, index) => (
              <ReceivedMethodRow
                key={method.paymentMethodId}
                name={method.paymentMethodName}
                id={method.paymentMethodId}
                amount={method.amount}
                count={count(method.paymentMethodId)}
                disabled={disabled}
                separated={index > 0}
                onOpen={onOpen}
              />
            ))}
          </LedgerCard>
        </View>
      ) : null}
    </View>
  );
}
