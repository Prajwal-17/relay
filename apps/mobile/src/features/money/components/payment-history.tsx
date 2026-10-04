import { Pencil, Trash2 } from "lucide-react-native";
import { ActivityIndicator, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { LedgerCard } from "@/components/ui/ledger-card";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { usePalette } from "@/theme/palette";
import type { ReceivedEntry } from "../money.types";
import { entryDateTimes } from "../payment-history.utils";
import { MoneyAmount } from "./money-amount";

interface PaymentHistoryProps {
  entries: ReceivedEntry[];
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => Promise<void>;
  deletingId: number | null;
  deletionDisabled: boolean;
  onDelete: (entry: ReceivedEntry) => void;
  onEdit: (entry: ReceivedEntry) => void;
}

export function PaymentHistory({
  entries,
  hasMore,
  loadingMore,
  loadMore,
  deletingId,
  deletionDisabled,
  onDelete,
  onEdit
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
          {entries.map((entry, index) => {
            const times = entryDateTimes(entry.createdAt, entry.updatedAt);
            return (
              <View
                key={entry.id}
                className={`gap-1 px-4 py-3 ${index < entries.length - 1 ? "border-border border-b" : ""}`}
              >
                <View className="flex-row items-center gap-2">
                  <View className="min-w-0 flex-1 gap-1">
                    <MoneyAmount amount={entry.amount} />
                    <Text className="text-muted-foreground text-xs tabular-nums">
                      Created {times.created}
                    </Text>
                    {times.updated ? (
                      <Text className="text-muted-foreground text-xs tabular-nums">
                        Updated {times.updated}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityLabel={`Edit entry of ${formatRupee(entry.amount)}`}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: deletionDisabled || deletingId !== null }}
                    disabled={deletionDisabled || deletingId !== null}
                    className="min-h-12 min-w-12 items-center justify-center"
                    onPress={() => onEdit(entry)}
                  >
                    <Pencil color={colors["muted-foreground"]} size={18} strokeWidth={1.8} />
                  </Pressable>
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
            );
          })}
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
