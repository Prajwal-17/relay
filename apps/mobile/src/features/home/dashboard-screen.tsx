import { router } from "expo-router";
import { ArrowRight, ArrowUpRight, Banknote, ReceiptText } from "lucide-react-native";
import { useState } from "react";
import { Image, ScrollView, View } from "react-native";

import { Pressable } from "@/components/ui/pressable";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { usePalette } from "@/theme/palette";

import dashboard from "./dashboard-data.json";

function SectionHeading({ title, detail }: { title: string; detail: string }) {
  return (
    <View className="mb-3 flex-row items-end justify-between gap-3">
      <Text accessibilityRole="header" className="text-foreground text-base font-semibold">
        {title}
      </Text>
      <Text className="text-muted-foreground text-xs">{detail}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = usePalette();
  const [periodIndex, setPeriodIndex] = useState(0);
  const period = dashboard.periods[periodIndex];
  const peakBar = Math.max(...period.chartBars);

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mx-auto w-full max-w-xl px-4 pt-5 pb-8">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-row items-center gap-3">
              <Image
                source={require("../../../assets/images/relay-icon.png")}
                className="rounded-card h-10 w-10"
                accessibilityIgnoresInvertColors
              />
              <View>
                <Text className="text-foreground text-base leading-5 font-bold">Relay</Text>
                <Text className="text-muted-foreground text-xs">{dashboard.shop.name}</Text>
              </View>
            </View>
            <View className="border-frame rounded-control border px-2 py-1">
              <Text className="text-muted-foreground text-[11px] font-medium">
                {dashboard.shop.sampleLabel}
              </Text>
            </View>
          </View>

          <View className="mt-8 mb-5">
            <Text accessibilityRole="header" className="text-foreground text-[28px] font-bold">
              Daily brief
            </Text>
            <Text className="text-muted-foreground mt-1 text-sm">{dashboard.shop.subtitle}</Text>
          </View>

          <View accessibilityRole="tablist" className="border-border mb-4 flex-row border-b">
            {dashboard.periods.map((item, index) => {
              const selected = periodIndex === index;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.label}
                  className={`min-h-12 min-w-0 flex-1 items-center justify-center border-b-2 ${selected ? "border-counter-accent" : "border-transparent"}`}
                  onPress={() => setPeriodIndex(index)}
                >
                  <Text
                    className={`text-[13px] font-semibold ${selected ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="border-frame bg-card rounded-card border px-5 pt-5 pb-4">
            <View className="flex-row items-start justify-between gap-3">
              <Text className="text-foreground text-sm font-semibold">{period.salesLabel}</Text>
              <View className="bg-sales-soft rounded-control flex-row items-center gap-1 px-2 py-1">
                <ArrowUpRight color={colors["sales-ink"]} size={15} strokeWidth={2} />
                <Text className="text-sales-ink text-xs font-semibold">{period.change}</Text>
              </View>
            </View>
            <Text
              accessibilityLiveRegion="polite"
              className="text-foreground mt-4 text-[36px] leading-[44px] font-bold tracking-tight"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {period.sales}
            </Text>
            <Text className="text-muted-foreground mt-1 text-xs">{period.comparison}</Text>
            <View className="border-border mt-5 flex-row border-t pt-4">
              <View className="min-w-0 flex-1">
                <Text className="text-muted-foreground text-xs">Orders</Text>
                <Text
                  className="text-foreground mt-1 text-lg font-semibold"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {period.orders}
                </Text>
              </View>
              <View className="border-border min-w-0 flex-1 border-l pl-4">
                <Text className="text-muted-foreground text-xs">Average order</Text>
                <Text
                  className="text-foreground mt-1 text-lg font-semibold"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {period.average}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityLabel="Open live Money ledger"
            className="bg-primary rounded-control mt-3 min-h-14 flex-row items-center justify-between px-4"
            onPress={() => router.navigate("/money")}
          >
            <View className="flex-row items-center gap-3">
              <Banknote color={colors["primary-foreground"]} size={21} strokeWidth={1.8} />
              <Text className="text-primary-foreground text-[15px] font-semibold">
                Open live Money
              </Text>
            </View>
            <ArrowRight color={colors["primary-foreground"]} size={19} strokeWidth={1.8} />
          </Pressable>
          <Text className="text-muted-foreground mt-2 text-xs">
            Your Money ledger is live. Figures on this page are sample data.
          </Text>

          <View className="mt-8">
            <SectionHeading title="Sales rhythm" detail={period.chartLabel} />
            <View className="border-border bg-card rounded-card border px-4 pt-4 pb-3">
              <View className="flex-row items-end justify-between gap-3">
                <Text
                  className="text-foreground text-lg font-semibold"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {period.chartValue}
                </Text>
                <Text className="text-muted-foreground text-xs">Sample trend</Text>
              </View>
              <View
                accessible
                accessibilityRole="image"
                accessibilityLabel={period.chartSummary}
                className="mt-5 flex-row items-end gap-2"
              >
                {period.chartBars.map((height, index) => (
                  <View key={`${period.id}-${index}`} className="min-w-0 flex-1 items-center">
                    <View className="h-24 w-full max-w-12 justify-end">
                      <View
                        className="rounded-t-control w-full"
                        style={{
                          height: (height / 100) * 96,
                          backgroundColor:
                            height === peakBar ? colors["sales-ink"] : colors.selected
                        }}
                      />
                    </View>
                    <Text className="text-muted-foreground mt-2 text-xs font-medium">
                      {period.chartDays[index]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className="mt-8">
            <SectionHeading title="Recent sales" detail="Sample activity" />
            <View className="border-border bg-card rounded-card border px-4">
              {dashboard.transactions.map((transaction, index) => (
                <View
                  key={transaction.id}
                  className={`min-h-16 flex-row items-center gap-3 py-3 ${index ? "border-border border-t" : ""}`}
                >
                  <View className="min-w-0 flex-1">
                    <Text className="text-foreground text-[13px] font-semibold" numberOfLines={1}>
                      {transaction.customer}
                    </Text>
                    <Text
                      className="text-muted-foreground mt-1 text-xs"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {transaction.detail}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-foreground text-[13px] font-semibold"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {transaction.amount}
                    </Text>
                    <Text
                      className={`mt-1 text-xs ${transaction.status === "Paid" ? "text-sales-ink" : "text-muted-foreground"}`}
                    >
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-8">
            <SectionHeading title="Popular products" detail="Sample catalog" />
            <View className="border-border bg-card rounded-card border px-4">
              {dashboard.products.map((product, index) => (
                <View
                  key={product.name}
                  className={`min-h-14 flex-row items-center justify-between gap-3 py-3 ${index ? "border-border border-t" : ""}`}
                >
                  <View className="min-w-0 flex-1">
                    <Text className="text-foreground text-[13px] font-semibold" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="text-muted-foreground mt-1 text-xs">{product.detail}</Text>
                  </View>
                  <Text
                    className="text-foreground text-[13px] font-semibold"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {product.price}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="border-border mt-8 flex-row items-start gap-3 border-t pt-4">
            <ReceiptText color={colors["muted-foreground"]} size={18} strokeWidth={1.8} />
            <Text className="text-muted-foreground min-w-0 flex-1 text-xs leading-5">
              This sample brief previews a future store overview. Sales and product figures do not
              come from your account.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
