import { Tabs } from "expo-router";
import { Banknote, House, Package, UsersRound } from "lucide-react-native";
import { View } from "react-native";

import { Pressable } from "@/components/ui/pressable";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { usePalette } from "@/theme/palette";

export const unstable_settings = {
  initialRouteName: "money"
};

const items = {
  home: { label: "Home", icon: House },
  products: { label: "Products", icon: Package },
  money: { label: "Money", icon: Banknote },
  customers: { label: "Customers", icon: UsersRound }
} as const;

export default function TabLayout() {
  const colors = usePalette();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{ headerShown: false, lazy: true }}
      tabBar={({ state, navigation }) => (
        <SafeAreaView className="bg-surface border-frame border-t" edges={["bottom"]}>
          <View className="flex-row gap-1 px-2 pt-2 pb-1">
            {state.routes.map((route, index) => {
              const item = items[route.name as keyof typeof items];
              if (!item) return null;

              const focused = state.index === index;
              const Icon = item.icon;

              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="tab"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: focused }}
                  className={`rounded-control min-h-14 flex-1 items-center justify-center gap-1 px-1 ${focused ? "bg-selected" : "bg-transparent"}`}
                  onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
                  onPress={() => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true
                    });

                    if (!focused && !event.defaultPrevented) {
                      navigation.navigate(route.name, route.params);
                    }
                  }}
                >
                  <View
                    className={`h-0.5 w-5 rounded-full ${focused ? "bg-accent" : "bg-transparent"}`}
                  />
                  <Icon
                    color={focused ? colors.primary : colors.muted}
                    size={21}
                    strokeWidth={focused ? 2.2 : 1.8}
                  />
                  <Text
                    className={`text-[11px] leading-4 ${focused ? "text-ink font-semibold" : "text-muted font-medium"}`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
      )}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="products" options={{ title: "Products" }} />
      <Tabs.Screen name="money" options={{ title: "Money" }} />
      <Tabs.Screen name="customers" options={{ title: "Customers" }} />
    </Tabs>
  );
}
