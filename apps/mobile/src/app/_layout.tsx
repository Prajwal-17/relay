import "../../global.css";

import { DatabaseBackup, RotateCcw } from "lucide-react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { migrateDatabase } from "@/lib/db/money-database";
import { usePalette } from "@/theme/palette";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Inter-Regular": require("../../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../../assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../../assets/fonts/Inter-Bold.ttf")
  });

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <DatabaseLayout />
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const colors = usePalette();
  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="vendor-payment" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="payment" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="entry" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="channels" options={{ presentation: "modal", animation: "slide_from_right" }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

function DatabaseLayout() {
  const colors = usePalette();
  const [databaseKey, setDatabaseKey] = useState(0);
  const [databaseError, setDatabaseError] = useState<Error | null>(null);

  if (databaseError) {
    return (
      <SafeAreaView className="bg-canvas flex-1 items-center justify-center px-6">
        <View className="border-border bg-surface rounded-card w-full max-w-sm items-center border p-6">
          <View className="bg-accent-soft mb-4 h-12 w-12 items-center justify-center rounded-full">
            <DatabaseBackup color={colors.accent} size={24} strokeWidth={1.8} />
          </View>
          <Text accessibilityRole="header" className="text-ink text-xl font-semibold">
            Ledger could not open
          </Text>
          <Text className="text-muted my-3 text-center text-sm leading-5">
            {databaseError.message || "The local money database could not be prepared."}
          </Text>
          <AppButton
            className="w-full"
            icon={RotateCcw}
            onPress={() => {
              setDatabaseError(null);
              setDatabaseKey((value) => value + 1);
            }}
          >
            Try again
          </AppButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SQLiteProvider
      key={databaseKey}
      databaseName="relay-money.db"
      onInit={migrateDatabase}
      onError={setDatabaseError}
    >
      <RootNavigator />
    </SQLiteProvider>
  );
}
