import { NativeTabs } from "expo-router/unstable-native-tabs";

import { usePalette } from "@/theme/palette";

export const unstable_settings = {
  initialRouteName: "money"
};

export default function TabLayout() {
  const colors = usePalette();

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      disableTransparentOnScrollEdge
      iconColor={{ default: colors.muted, selected: colors.primary }}
      indicatorColor={colors.selected}
      labelStyle={{
        default: { color: colors.muted, fontFamily: "Inter-Medium", fontSize: 11 },
        selected: { color: colors.primary, fontFamily: "Inter-SemiBold", fontSize: 11 }
      }}
      minimizeBehavior="never"
      shadowColor={colors.border}
      tintColor={colors.primary}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="products">
        <NativeTabs.Trigger.Icon
          sf={{ default: "shippingbox", selected: "shippingbox.fill" }}
          md="inventory_2"
        />
        <NativeTabs.Trigger.Label>Products</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="money">
        <NativeTabs.Trigger.Icon
          sf={{ default: "banknote", selected: "banknote.fill" }}
          md="point_of_sale"
        />
        <NativeTabs.Trigger.Label>Till</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="customers">
        <NativeTabs.Trigger.Icon
          sf={{ default: "person.2", selected: "person.2.fill" }}
          md="groups"
        />
        <NativeTabs.Trigger.Label>Customers</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
