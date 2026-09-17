import { Pressable } from "@/components/ui/pressable";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Plus } from "lucide-react-native";
import { IconButton } from "@/components/ui/icon-button";
import { PaymentIcon } from "./payment-icon";
import { formatRupee } from "@/lib/format/money";
import type { DailyEntry, OnlineChannel } from "../money.types";

export function ReceivedMethods({
  entry,
  channels,
  onOpen,
  disabled
}: {
  entry: DailyEntry | null;
  channels: OnlineChannel[];
  onOpen: (channelId: number | null, history?: boolean) => void;
  disabled: boolean;
}) {
  const methods = [
    { id: null, name: "Cash", amount: entry?.cashPaisa ?? 0, archived: false },
    ...channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      archived: channel.isArchived,
      amount: entry?.onlineReceipts.find((r) => r.channelId === channel.id)?.amountPaisa ?? 0
    }))
  ];
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="text-ink text-base font-semibold">
        Received
      </Text>
      <Text className="text-muted text-xs">Tap a total for history. Use + to add.</Text>
      <View>
        {methods.map((method) => (
          <View
            key={method.id ?? "cash"}
            className="border-border flex-row items-center gap-3 border-b py-3 last:border-b-0"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${method.name}, ${formatRupee(method.amount)}. View payment history`}
              disabled={disabled}
              onPress={() => onOpen(method.id, true)}
              className="min-h-12 min-w-0 flex-1 flex-row flex-wrap items-center gap-x-3 gap-y-1"
            >
              <PaymentIcon name={method.name} kind={method.id === null ? "cash" : "upi"} />
              <Text className="text-muted min-w-0 flex-1 text-xs">
                {method.name}
                {method.archived ? " · Archived" : ""}
              </Text>
              <Text className="text-ink w-full text-base font-semibold tabular-nums">
                {formatRupee(method.amount)}
              </Text>
            </Pressable>
            {!method.archived ? (
              <IconButton
                icon={Plus}
                label={`Add ${method.name} payment`}
                disabled={disabled}
                className="bg-accent-soft border-transparent"
                onPress={() => onOpen(method.id)}
              />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
