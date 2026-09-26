import "../../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { RotateCcw, WifiOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth/auth-client";
import { QueryProvider } from "@/lib/query/query-provider";
import { NAV_THEME } from "@/lib/theme";
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
    <ThemeProvider value={NAV_THEME.light}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryProvider>
            <SessionLayout />
          </QueryProvider>
        </SafeAreaProvider>
        <PortalHost />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

function SessionLayout() {
  const colors = usePalette();
  const session = authClient.useSession();
  const [retryingSession, setRetryingSession] = useState(false);

  useEffect(() => {
    if (!session.isPending) void SplashScreen.hideAsync();
  }, [session.isPending]);

  if (session.isPending && !retryingSession) return null;

  if ((session.error && !session.data) || retryingSession) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center px-6">
        <View className="border-border bg-card rounded-card w-full max-w-sm items-center border p-6">
          <View className="bg-counter-accent-soft mb-4 h-12 w-12 items-center justify-center rounded-full">
            <WifiOff color={colors["counter-accent"]} size={24} strokeWidth={1.8} />
          </View>
          <Text accessibilityRole="header" className="text-foreground text-xl font-semibold">
            Relay could not connect
          </Text>
          <Text className="text-muted-foreground my-3 text-center text-sm leading-5">
            We could not restore your session. Check your connection, then try again.
          </Text>
          <AppButton
            className="w-full"
            icon={RotateCcw}
            loading={retryingSession}
            loadingLabel="Trying again…"
            onPress={() => {
              if (retryingSession) return;
              setRetryingSession(true);
              void session.refetch().finally(() => setRetryingSession(false));
            }}
          >
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
    contentStyle: { backgroundColor: colors.background }
  };

  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      >
        <Stack.Protected guard={!session.data}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={Boolean(session.data)}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="payment" options={{ headerShown: false }} />
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
