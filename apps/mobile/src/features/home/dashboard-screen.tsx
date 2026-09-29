import { router } from "expo-router";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Package,
  ShoppingBag,
  TrendingUp,
  UsersRound,
  Wallet
} from "lucide-react-native";
import { useState } from "react";
import { Image, ScrollView, View } from "react-native";

import { Pressable } from "@/components/ui/pressable";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { usePalette } from "@/theme/palette";

import dashboard from "./dashboard-data.json";

const actions = {
  money: { route: "/money", icon: Banknote },
  product: { route: "/products", icon: Package },
  customer: { route: "/customers", icon: UsersRound }
} as const;

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return (
    <View className="mb-3">
      <Text accessibilityRole="header" className="text-foreground text-base font-semibold">
        {title}
      </Text>
      <Text className="text-muted-foreground mt-1 text-xs">{detail}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = usePalette();
  const [periodIndex, setPeriodIndex] = useState(0);
  const period = dashboard.periods[periodIndex];

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mx-auto w-full max-w-xl px-4 pt-5 pb-8">
          <View className="mb-7 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Image
                source={require("../../../assets/images/relay-icon.png")}
                className="rounded-card h-10 w-10"
                accessibilityIgnoresInvertColors
              />
              <View>
                <Text className="text-foreground text-lg leading-5 font-bold">Relay</Text>
                <Text className="text-muted-foreground mt-1 text-xs">{dashboard.shop.name}</Text>
              </View>
            </View>
            <View className="bg-counter-accent-soft h-10 w-10 items-center justify-center rounded-full">
              <Text className="text-counter-accent-foreground text-xs font-semibold">
                {dashboard.shop.initials}
              </Text>
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-counter-accent text-[11px] font-semibold tracking-widest">
              {dashboard.shop.dateLabel}
            </Text>
            <Text accessibilityRole="header" className="text-foreground mt-2 text-[26px] font-bold">
              {dashboard.shop.greeting}.
            </Text>
            <Text className="text-muted-foreground mt-1 text-[13px]">
              Here&apos;s how your store is doing.
            </Text>
          </View>

          <View className="bg-muted rounded-card mb-3 flex-row p-1">
            {dashboard.periods.map((item, index) => {
              const selected = periodIndex === index;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.label}
                  className={`rounded-control min-h-11 flex-1 items-center justify-center border ${selected ? "border-frame bg-card" : "border-transparent"}`}
                  onPress={() => setPeriodIndex(index)}
                >
                  <Text
                    className={`text-xs font-semibold ${selected ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="bg-primary rounded-card px-5 py-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-2">
                <View className="bg-sales-soft h-2 w-2 rounded-full" />
                <Text className="text-primary-foreground text-xs opacity-80">
                  {period.salesLabel}
                </Text>
              </View>
              <View className="border-primary-foreground rounded-control border px-2 py-1">
                <Text className="text-primary-foreground text-[10px] font-semibold">SAMPLE</Text>
              </View>
            </View>
            <Text
              className="text-primary-foreground mt-5 text-[35px] leading-10 font-bold"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {period.sales}
            </Text>
            <View className="mt-4 flex-row items-center gap-2">
              <View className="bg-sales-ink rounded-control flex-row items-center gap-1 px-2 py-1">
                <ArrowUpRight color={colors["sales-soft"]} size={13} strokeWidth={2.2} />
                <Text className="text-sales-soft text-[11px] font-semibold">{period.change}</Text>
              </View>
              <Text className="text-primary-foreground text-xs opacity-70">
                {period.comparison}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row gap-3">
            <View className="border-border bg-card rounded-card min-w-0 flex-1 border p-4">
              <View className="bg-sales-soft rounded-control h-8 w-8 items-center justify-center">
                <ShoppingBag color={colors["sales-ink"]} size={17} strokeWidth={1.9} />
              </View>
              <Text className="text-foreground mt-3 text-xl font-bold">{period.orders}</Text>
              <Text className="text-muted-foreground mt-1 text-xs">{period.ordersCaption}</Text>
            </View>
            <View className="border-border bg-card rounded-card min-w-0 flex-1 border p-4">
              <View className="bg-counter-accent-soft rounded-control h-8 w-8 items-center justify-center">
                <Wallet color={colors["counter-accent"]} size={17} strokeWidth={1.9} />
              </View>
              <Text className="text-foreground mt-3 text-xl font-bold">{period.average}</Text>
              <Text className="text-muted-foreground mt-1 text-xs">{period.averageCaption}</Text>
            </View>
          </View>

          <View className="border-border bg-card rounded-card mt-4 border p-4">
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-muted-foreground text-xs">{period.chartLabel}</Text>
                <Text className="text-foreground mt-1 text-xl font-bold">{period.chartValue}</Text>
              </View>
              <View className="bg-sales-soft rounded-control h-9 w-9 items-center justify-center">
                <TrendingUp color={colors["sales-ink"]} size={18} strokeWidth={1.9} />
              </View>
            </View>
            <View className="mt-5 h-28 flex-row items-end gap-2">
              {period.bars.map((height, index) => (
                <View key={`${period.id}-${index}`} className="min-w-0 flex-1 items-center">
                  <View className="h-24 w-full max-w-8 justify-end">
                    <View
                      className="rounded-t-control w-full"
                      style={{
                        height: (height / 100) * 96,
                        backgroundColor:
                          index === period.bars.length - 2 ? colors["sales-ink"] : colors.selected
                      }}
                    />
                  </View>
                  <Text className="text-muted-foreground mt-2 text-[10px] font-medium">
                    {dashboard.chartDays[index]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-6">
            <SectionTitle title="Quick access" detail="Your everyday tools" />
            <View className="flex-row gap-2">
              {dashboard.quickActions.map((action) => {
                const target = actions[action.id as keyof typeof actions];
                const Icon = target.icon;
                return (
                  <Pressable
                    key={action.id}
                    accessibilityLabel={`Open ${action.title}`}
                    className="border-border bg-card rounded-card min-h-28 min-w-0 flex-1 border p-3"
                    onPress={() => router.navigate(target.route)}
                  >
                    <View className="bg-counter-accent-soft rounded-control h-9 w-9 items-center justify-center">
                      <Icon color={colors["counter-accent"]} size={19} strokeWidth={1.9} />
                    </View>
                    <Text className="text-foreground mt-3 text-xs font-semibold" numberOfLines={1}>
                      {action.title}
                    </Text>
                    <Text className="text-muted-foreground mt-1 text-[10px] leading-3">
                      {action.detail}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-6">
            <SectionTitle title="Recent sales" detail="Sample transactions" />
            <View className="border-border bg-card rounded-card border px-3">
              {dashboard.transactions.slice(0, 3).map((transaction, index) => (
                <View
                  key={transaction.id}
                  className={`min-h-16 flex-row items-center gap-3 py-3 ${index > 0 ? "border-border border-t" : ""}`}
                >
                  <View className="bg-muted rounded-control h-9 w-9 items-center justify-center">
                    <Text className="text-foreground text-[10px] font-semibold">
                      {transaction.initials}
                    </Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-foreground text-xs font-semibold" numberOfLines={1}>
                      {transaction.customer}
                    </Text>
                    <Text className="text-muted-foreground mt-1 text-[10px]">
                      {transaction.detail}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-foreground text-xs font-semibold">
                      {transaction.amount}
                    </Text>
                    <Text
                      className={`mt-1 text-[10px] font-medium ${transaction.status === "Paid" ? "text-sales-ink" : "text-muted-foreground"}`}
                    >
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-6">
            <SectionTitle title="Popular products" detail="Sample catalog highlights" />
            <View className="border-border bg-card rounded-card border px-3">
              {dashboard.products.map((product, index) => (
                <View
                  key={product.name}
                  className={`min-h-16 flex-row items-center gap-3 py-3 ${index > 0 ? "border-border border-t" : ""}`}
                >
                  <View className="bg-sales-soft rounded-control h-9 w-9 items-center justify-center">
                    <Text className="text-sales-ink text-xs font-semibold">{product.symbol}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-foreground text-xs font-semibold" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="text-muted-foreground mt-1 text-[10px]">{product.detail}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-foreground text-xs font-semibold">{product.price}</Text>
                    <Text className="text-muted-foreground mt-1 text-[10px]">{product.stock}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-6 flex-row items-center gap-2">
            <ArrowRight color={colors["muted-foreground"]} size={14} strokeWidth={1.8} />
            <Text className="text-muted-foreground min-w-0 flex-1 text-xs">
              Dashboard figures are illustrative and separate from Money.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
