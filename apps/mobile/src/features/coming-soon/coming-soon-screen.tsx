import { View } from "react-native";

import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";

export default function ComingSoonScreen() {
  return (
    <SafeAreaView className="bg-canvas flex-1">
      <View className="flex-1 items-center justify-center px-4">
        <Text accessibilityRole="header" className="text-ink text-xl font-semibold">
          Coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}
