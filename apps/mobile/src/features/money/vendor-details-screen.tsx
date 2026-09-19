import { useLocalSearchParams, router } from "expo-router";
import { Store, X } from "lucide-react-native";
import { ScrollView, View } from "react-native";

import { IconButton } from "@/components/ui/icon-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { formatRupee } from "@/lib/format/money";
import { usePalette } from "@/theme/palette";

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true
});

export default function VendorDetailsScreen() {
  const colors = usePalette();
  const params = useLocalSearchParams<{
    vendorName?: string;
    amount?: string;
    note?: string;
    createdAt?: string;
  }>();
  const amount = Number(params.amount);
  const validAmount = Number.isSafeInteger(amount) && amount >= 0;
  const createdAt =
    params.createdAt && !Number.isNaN(Date.parse(params.createdAt))
      ? dateTimeFormatter.format(new Date(params.createdAt))
      : "Time unavailable";

  return (
    <SafeAreaView className="bg-canvas flex-1" edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerClassName="px-4 pt-3 pb-6">
        <View className="w-full max-w-xl gap-5 self-center">
          <View className="flex-row items-center gap-3">
            <View className="bg-accent-soft rounded-control h-10 w-10 items-center justify-center">
              <Store color={colors["accent-ink"]} size={20} strokeWidth={1.8} />
            </View>
            <Text
              accessibilityRole="header"
              className="text-ink min-w-0 flex-1 text-xl font-semibold"
            >
              Payment details
            </Text>
            <IconButton icon={X} label="Close" onPress={() => router.back()} />
          </View>

          <View className="border-border bg-surface rounded-card gap-4 border p-4">
            <View>
              <Text className="text-muted text-xs">Vendor or payee</Text>
              <Text className="text-ink mt-1 text-lg font-semibold">
                {params.vendorName || "Unknown vendor"}
              </Text>
            </View>
            <View className="border-border border-t pt-4">
              <Text className="text-muted text-xs">Amount</Text>
              <Text className="text-ink mt-1 text-2xl font-bold tabular-nums">
                {validAmount ? formatRupee(amount) : "—"}
              </Text>
            </View>
            <View className="border-border border-t pt-4">
              <Text className="text-muted text-xs">Recorded</Text>
              <Text className="text-ink mt-1 text-sm">{createdAt}</Text>
            </View>
            <View className="border-border border-t pt-4">
              <Text className="text-muted text-xs">Note</Text>
              <Text className="text-ink mt-1 text-sm leading-5">{params.note || "No note"}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
