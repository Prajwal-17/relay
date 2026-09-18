import { View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import type { ReceivedEntry } from "../money.types";
import { paymentTime } from "../payment-history.utils";

interface PaymentHistoryProps {
  entries: ReceivedEntry[];
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => Promise<void>;
}

export function PaymentHistory({ entries, hasMore, loadingMore, loadMore }: PaymentHistoryProps) {
  return (
    <View className="gap-3" testID="payment-history">
      <Text accessibilityRole="header" className="text-ink text-base font-semibold">
        Entries
      </Text>
      {entries.length === 0 ? (
        <View className="border-border bg-surface rounded-card border px-4 py-6">
          <Text className="text-muted text-center text-sm">No entries for this method.</Text>
        </View>
      ) : (
        <View className="border-border bg-surface rounded-card overflow-hidden border">
          {entries.map((entry, index) => (
            <View
              key={entry.id}
              className={`gap-2 px-4 py-3 ${
                index < entries.length - 1 ? "border-border border-b" : ""
              }`}
            >
              <View className="flex-row flex-wrap items-baseline justify-between gap-2">
                <Text className="text-muted text-xs tabular-nums">
                  {paymentTime(entry.createdAt)}
                </Text>
                <Text
                  adjustsFontSizeToFit
                  className="text-ink max-w-[65%] text-right text-lg font-semibold tabular-nums"
                  numberOfLines={1}
                >
                  + {formatRupee(entry.amount)}
                </Text>
              </View>
              {entry.note ? (
                <Text className="text-ink text-sm leading-5">{entry.note}</Text>
              ) : (
                <Text className="text-muted text-xs">No note</Text>
              )}
            </View>
          ))}
        </View>
      )}
      {hasMore ? (
        <AppButton variant="outline" loading={loadingMore} onPress={() => void loadMore()}>
          Load older entries
        </AppButton>
      ) : null}
    </View>
  );
}
