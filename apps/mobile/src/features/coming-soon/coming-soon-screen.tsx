import { router, usePathname } from "expo-router";
import { Banknote, House, Package, UsersRound, type LucideIcon } from "lucide-react-native";
import { View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { usePalette } from "@/theme/palette";

const destinations: Record<string, { title: string; icon: LucideIcon; description: string }> = {
  "/home": {
    title: "Home",
    icon: House,
    description: "A broader view of the shop will live here. Today’s money is ready now."
  },
  "/products": {
    title: "Products",
    icon: Package,
    description: "Mobile product lookup is not available yet. Your daily money workflow is ready."
  },
  "/customers": {
    title: "Customers",
    icon: UsersRound,
    description:
      "Mobile customer accounts are coming later. Nothing has been hidden or partially enabled."
  }
};

export default function ComingSoonScreen() {
  const colors = usePalette();
  const pathname = usePathname();
  const destination = destinations[pathname] ?? destinations["/home"];
  const Icon = destination.icon;

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top", "left", "right"]}>
      <View className="mx-auto w-full max-w-xl flex-1 px-4 pt-4 pb-8">
        <View className="flex-1 items-center justify-center px-4">
          <View className="border-frame bg-card rounded-card w-full items-center border px-6 py-8">
            <View className="bg-counter-accent-soft mb-5 h-14 w-14 items-center justify-center rounded-full">
              <Icon color={colors["counter-accent-foreground"]} size={26} strokeWidth={1.9} />
            </View>
            <Text
              accessibilityRole="header"
              className="text-foreground text-center text-xl font-semibold"
            >
              {destination.title} is coming later
            </Text>
            <Text className="text-muted-foreground mt-3 max-w-sm text-center text-sm leading-6">
              {destination.description}
            </Text>
            <AppButton
              className="mt-6 w-full"
              icon={Banknote}
              onPress={() => router.navigate("/money")}
            >
              Open Money
            </AppButton>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
