import "../../global.css";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { RotateCcw, WifiOff } from "lucide-react-native";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth/auth-client";
import { QueryProvider } from "@/lib/query/query-provider";
import { usePalette } from "@/theme/palette";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    "Inter-Regular": require("../../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../../assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("../../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../../assets/fonts/Inter-Bold.ttf")
  });

  if (!loaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <SessionLayout />
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function SessionLayout() {
  const colors = usePalette();
  const session = authClient.useSession();

  useEffect(() => {
    if (!session.isPending) void SplashScreen.hideAsync();
  }, [session.isPending]);

  if (session.isPending) return null;

  if (session.error && !session.data) {
    return (
      <SafeAreaView className="bg-canvas flex-1 items-center justify-center px-6">
        <View className="border-border bg-surface rounded-card w-full max-w-sm items-center border p-6">
          <View className="bg-accent-soft mb-4 h-12 w-12 items-center justify-center rounded-full">
            <WifiOff color={colors.accent} size={24} strokeWidth={1.8} />
          </View>
          <Text accessibilityRole="header" className="text-ink text-xl font-semibold">
            Relay could not connect
          </Text>
          <Text className="text-muted my-3 text-center text-sm leading-5">
            We could not restore your session. Check your connection, then try again.
          </Text>
          <AppButton className="w-full" icon={RotateCcw} onPress={() => void session.refetch()}>
            Try again
          </AppButton>
        </View>
      </SafeAreaView>
    );
  }

  const sheetOptions = {
    presentation: "formSheet" as const,
    headerShown: false,
    headerBackButtonMenuEnabled: false,
    sheetGrabberVisible: true,
    contentStyle: { backgroundColor: colors.canvas }
  };

  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}
      >
        <Stack.Protected guard={!session.data}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(session.data)}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="calendar"
            options={{ ...sheetOptions, sheetAllowedDetents: [0.68] }}
          />
          <Stack.Screen
            name="payment"
            options={{ ...sheetOptions, sheetAllowedDetents: [0.72, 0.96] }}
          />
          <Stack.Screen
            name="vendor-payment"
            options={{ ...sheetOptions, sheetAllowedDetents: [0.78, 0.96] }}
          />
          <Stack.Screen
            name="vendor-details"
            options={{ ...sheetOptions, sheetAllowedDetents: "fitToContents" }}
          />
        </Stack.Protected>
      </Stack>
      <StatusBar style={session.data ? "dark" : "light"} />
    </>
  );
}
