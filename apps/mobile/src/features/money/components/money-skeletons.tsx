import type { PropsWithChildren } from "react";
import { View } from "react-native";

import { LedgerCard } from "@/components/ui/ledger-card";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingRegion({ children }: PropsWithChildren) {
  return (
    <View
      testID="money-loading-skeleton"
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
      className="gap-4"
    >
      {children}
    </View>
  );
}

export function MoneyLedgerSkeleton() {
  return (
    <LoadingRegion>
      <LedgerCard className="border-frame">
        <View className="gap-3 p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-36" />
        </View>
        <View className="border-border flex-row border-t">
          {[0, 1].map((column) => (
            <View key={column} className="flex-1 gap-2 p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </View>
          ))}
        </View>
      </LedgerCard>
      <Skeleton className="h-5 w-24" />
      <LedgerCard className="border-frame">
        <View className="min-h-16 flex-row items-center gap-3 p-3">
          <Skeleton className="h-8 w-12" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-14" />
          </View>
          <Skeleton className="h-5 w-20" />
        </View>
        <View className="border-border flex-row border-t">
          {[0, 1].map((column) => (
            <View
              key={column}
              className={`min-h-24 flex-1 gap-3 p-3 ${column ? "border-border border-l" : ""}`}
            >
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-5 w-24" />
            </View>
          ))}
        </View>
      </LedgerCard>
      <Skeleton className="h-5 w-32" />
      <LedgerCard className="gap-3 p-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48" />
      </LedgerCard>
    </LoadingRegion>
  );
}

export function MoneyEntrySkeleton({ vendor }: { vendor: boolean }) {
  return (
    <LoadingRegion>
      <View className="py-2">
        <Skeleton className="h-12 w-full" />
      </View>
      <Skeleton className="h-4 w-24" />
      {vendor ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        <View className="flex-row gap-2">
          {[0, 1, 2].map((method) => (
            <Skeleton key={method} className="h-12 flex-1" />
          ))}
        </View>
      )}
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-12 w-full" />
    </LoadingRegion>
  );
}

export function EntryFooterSkeleton() {
  return (
    <View aria-hidden>
      <Skeleton className="h-12 w-full" />
    </View>
  );
}

export function PaymentHistorySkeleton() {
  return (
    <LoadingRegion>
      <LedgerCard className="flex-row justify-between gap-3 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-24" />
      </LedgerCard>
      <LedgerCard>
        {[0, 1, 2].map((row) => (
          <View key={row} className="flex-row justify-between gap-3 p-4">
            <View className="gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32" />
            </View>
            <Skeleton className="h-10 w-10" />
          </View>
        ))}
      </LedgerCard>
    </LoadingRegion>
  );
}
