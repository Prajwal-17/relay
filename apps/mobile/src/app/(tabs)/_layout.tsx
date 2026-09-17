import { usePalette } from "@/theme/palette";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { Banknote, House, Package, Users, type LucideIcon } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ICONS: Record<string, LucideIcon> = {
  home: House,
  products: Package,
  money: Banknote,
  customers: Users
};

export default function TabLayout() {
  const colors = usePalette();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="money"
      screenListeners={{
        tabPress: () => {
          void Haptics.selectionAsync().catch(() => {});
        }
      }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: colors.ink,
        tabBarActiveBackgroundColor: colors.selected,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: 6,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          shadowOpacity: 0
        },
        tabBarItemStyle: { paddingBottom: 6 },
        tabBarLabelStyle: { fontFamily: "Inter-SemiBold", fontSize: 12, lineHeight: 16 },
        tabBarIcon: ({ color, focused }) => {
          const Icon = TAB_ICONS[route.name];
          return Icon ? <Icon size={24} color={color} strokeWidth={focused ? 2.3 : 1.8} /> : null;
        }
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="products" options={{ title: "Products" }} />
      <Tabs.Screen name="money" options={{ title: "Money" }} />
      <Tabs.Screen name="customers" options={{ title: "Customers" }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
