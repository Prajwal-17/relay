import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { AppButton } from "@/components/ui/app-button";
import { formatRupee } from "@/lib/format/money";
import type { LocalDate, ReceiptEvent } from "../money.types";
import { groupPaymentHistory, paymentTime } from "../payment-history.utils";

interface PaymentHistoryProps {
  date: LocalDate | null;
  events: ReceiptEvent[];
  hasMore: boolean;
  loadingMore: boolean;
  saving: boolean;
  loadMore: () => Promise<void>;
}
export function PaymentHistory({
  date,
  events,
  hasMore,
  loadingMore,
  saving,
  loadMore
}: PaymentHistoryProps) {
  return (
    <View className="gap-3" testID="payment-history">
      <View className="gap-2">
        <Text accessibilityRole="header" className="text-ink text-base font-semibold">
          History
        </Text>
      </View>
      {events.length === 0 ? (
        <View>
          <Text className="text-muted py-4 text-sm">No payments added yet.</Text>
        </View>
      ) : (
        groupPaymentHistory(events, date).map((group) => (
          <View key={group.key} className="gap-2">
            {group.label ? (
              <Text className="text-muted text-xs font-medium">{group.label}</Text>
            ) : null}
            <View>
              {group.events.map((event) => (
                <View
                  key={event.id}
                  className="border-border flex-row flex-wrap items-center justify-between gap-3 border-b py-4 last:border-b-0"
                >
                  <View className="min-w-[40%] flex-1 gap-1">
                    {event.name ? (
                      <Text className="text-ink text-base font-semibold">{event.name}</Text>
                    ) : null}
                    {paymentTime(event.recordedAt) ? (
                      <Text className="text-muted text-xs leading-5 tabular-nums">
                        {paymentTime(event.recordedAt)}
                      </Text>
                    ) : null}
                  </View>
                  <Text className="text-ink ml-auto max-w-full text-right text-lg font-semibold tabular-nums">
                    {event.kind === "opening" ? "" : event.amountPaisa > 0 ? "+ " : "− "}
                    {formatRupee(Math.abs(event.amountPaisa))}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
      {hasMore ? (
        <AppButton
          variant="outline"
          loading={loadingMore}
          disabled={saving}
          onPress={() => void loadMore()}
        >
          Load older payments
        </AppButton>
      ) : null}
    </View>
  );
}
