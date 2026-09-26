import { Trash2 } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { LedgerCard } from "@/components/ui/ledger-card";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { usePalette } from "@/theme/palette";
import type { ReceivedEntry } from "../money.types";
import { paymentTime } from "../payment-history.utils";

interface PaymentHistoryProps {
  entries: ReceivedEntry[];
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => Promise<void>;
  deletingId: number | null;
  deletionDisabled: boolean;
  onDelete: (entry: ReceivedEntry) => void;
}

export function PaymentHistory({
  entries,
  hasMore,
  loadingMore,
  loadMore,
  deletingId,
  deletionDisabled,
  onDelete
}: PaymentHistoryProps) {
  const colors = usePalette();
  return (
    <View className="gap-3" testID="payment-history">
      {entries.length === 0 ? (
        <LedgerCard className="items-center px-4 py-8">
          <Text className="text-foreground text-base font-semibold">No entries yet</Text>
          <Text className="text-muted-foreground mt-1 text-center text-sm">
            New entries for this payment method will appear here.
          </Text>
        </LedgerCard>
      ) : (
        <LedgerCard>
          {entries.map((entry, index) => (
            <View
              key={entry.id}
              className={`gap-1 px-4 py-3 ${index < entries.length - 1 ? "border-border border-b" : ""}`}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-muted-foreground min-w-0 flex-1 text-xs tabular-nums">
                  {paymentTime(entry.createdAt)}
                </Text>
                <Text
                  adjustsFontSizeToFit
                  className="text-foreground max-w-[60%] text-right text-base font-semibold tabular-nums"
                  numberOfLines={1}
                >
                  + {formatRupee(entry.amount)}
                </Text>
                <Pressable
                  accessibilityLabel={`Delete entry of ${formatRupee(entry.amount)}`}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: deletionDisabled || deletingId !== null,
                    busy: deletingId === entry.id
                  }}
                  disabled={deletionDisabled || deletingId !== null}
                  className="min-h-12 min-w-12 items-center justify-center"
                  onPress={() => onDelete(entry)}
                >
                  {deletingId === entry.id ? (
                    <ActivityIndicator color={colors.destructive} size="small" />
                  ) : (
                    <Trash2 color={colors.destructive} size={18} strokeWidth={1.8} />
                  )}
                </Pressable>
              </View>
              {entry.note ? (
                <Text className="text-foreground text-sm leading-5">{entry.note}</Text>
              ) : null}
            </View>
          ))}
        </LedgerCard>
      )}
      {hasMore ? (
        <AppButton
          variant="outline"
          loading={loadingMore}
          loadingLabel="Loading…"
          onPress={() => void loadMore()}
        >
          Load older entries
        </AppButton>
      ) : null}
    </View>
  );
}
