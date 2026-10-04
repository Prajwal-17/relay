import { usePathname } from "expo-router";
import { House, Package, UsersRound, type LucideIcon } from "lucide-react-native";
import { View } from "react-native";

import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { usePalette } from "@/theme/palette";

const destinations: Record<string, { title: string; icon: LucideIcon }> = {
  "/home": { title: "Home", icon: House },
  "/products": { title: "Products", icon: Package },
  "/customers": { title: "Customers", icon: UsersRound }
};

export default function ComingSoonScreen() {
  const colors = usePalette();
  const pathname = usePathname();
  const destination = destinations[pathname] ?? destinations["/home"];
  const Icon = destination.icon;

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top", "left", "right"]}>
      <View className="mx-auto w-full max-w-xl flex-1 items-center justify-center gap-3 px-4">
        <Icon color={colors["muted-foreground"]} size={32} strokeWidth={1.8} />
        <Text
          accessibilityRole="header"
          className="text-foreground text-center text-lg font-semibold"
        >
          {destination.title}
        </Text>
        <Text className="text-muted-foreground text-center text-sm">Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
