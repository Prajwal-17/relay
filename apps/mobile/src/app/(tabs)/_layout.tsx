import { Tabs } from "expo-router";
import { Banknote, House, Package, UserRound, UsersRound } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pressable } from "@/components/ui/pressable";
import { usePalette } from "@/theme/palette";

export const unstable_settings = {
  initialRouteName: "money"
};

const items = {
  home: { label: "Home", icon: House },
  products: { label: "Products", icon: Package },
  money: { label: "Money", icon: Banknote },
  customers: { label: "Customers", icon: UsersRound },
  profile: { label: "Account", icon: UserRound }
} as const;

export default function TabLayout() {
  const colors = usePalette();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="money"
      backBehavior="history"
      screenOptions={({ route }) => {
        const item = items[route.name as keyof typeof items];
        const Icon = item?.icon ?? Banknote;

        return {
          animation: "none",
          headerShown: false,
          lazy: true,
          tabBarActiveTintColor: colors["counter-accent-foreground"],
          tabBarButton: ({
            android_ripple: _androidRipple,
            href: _href,
            hoverEffect: _hoverEffect,
            pressColor: _pressColor,
            pressOpacity: _pressOpacity,
            ref: _ref,
            ...props
          }) => <Pressable {...props} android_ripple={{ color: "transparent" }} />,
          tabBarInactiveTintColor: colors["muted-foreground"],
          tabBarIcon: ({ focused }) => (
            <View
              className={`h-7 w-14 items-center justify-center rounded-full ${focused ? "bg-counter-accent-soft" : "bg-transparent"}`}
            >
              <Icon
                color={focused ? colors["counter-accent"] : colors["muted-foreground"]}
                size={20}
                strokeWidth={focused ? 2.1 : 1.8}
              />
            </View>
          ),
          tabBarIconStyle: { height: 28, width: 56 },
          tabBarItemStyle: { height: 50 },
          tabBarLabel: item?.label ?? route.name,
          tabBarLabelStyle: { fontFamily: "Inter-Medium", fontSize: 11 },
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderTopWidth: 1,
            height: 62 + insets.bottom,
            overflow: "hidden",
            paddingBottom: insets.bottom + 6,
            paddingTop: 6
          }
        };
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="products" options={{ title: "Products" }} />
      <Tabs.Screen name="money" options={{ title: "Money" }} />
      <Tabs.Screen name="customers" options={{ title: "Customers" }} />
      <Tabs.Screen name="profile" options={{ title: "Account" }} />
    </Tabs>
  );
}
