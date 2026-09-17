import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Plus } from "lucide-react-native";
import { AppButton } from "@/components/ui/app-button";
import { PaymentIcon } from "./payment-icon";
import { formatRupee } from "@/lib/format/money";
import type { DailyEntry } from "../money.types";

export function DayDetails({
  entry,
  onAdd,
  disabled
}: {
  entry: DailyEntry | null;
  onAdd: () => void;
  disabled: boolean;
}) {
  const payments = entry?.supplierPayments ?? [];
  return (
    <View className="gap-3">
      <View className="gap-3">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Text className="text-ink text-base font-semibold">
            Vendor payments · {payments.length}
          </Text>
          <AppButton
            compact
            icon={Plus}
            variant="outline"
            disabled={disabled}
            accessibilityLabel="Add vendor payment"
            onPress={onAdd}
          >
            Add
          </AppButton>
        </View>
        {payments.length ? (
          <View>
            {payments.map((payment) => (
              <MoneyRow
                key={payment.id}
                name={payment.payee}
                kind="vendor"
                amount={payment.amountPaisa}
                note={payment.note}
              />
            ))}
          </View>
        ) : (
          <Text className="text-muted text-sm">No payments</Text>
        )}
      </View>
    </View>
  );
}

function MoneyRow({
  name,
  amount,
  kind = "upi",
  note
}: {
  name: string;
  amount: number;
  kind?: "cash" | "upi" | "vendor";
  note?: string | null;
}) {
  return (
    <View className="border-border flex-row items-center gap-3 border-b py-3 last:border-b-0">
      <PaymentIcon name={name} kind={kind} />
      <View className="min-w-0 flex-1">
        <Text className="text-ink text-sm font-medium">{name}</Text>
        {note ? <Text className="text-muted mt-1 text-sm">{note}</Text> : null}
      </View>
      <Text className="text-ink max-w-[55%] text-right text-base font-semibold tabular-nums">
        {formatRupee(amount)}
      </Text>
    </View>
  );
}
