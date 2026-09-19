import { router } from "expo-router";
import { LogIn, ShieldCheck, WifiOff } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth/auth-client";
import { useNetworkStatus } from "@/lib/network/use-network-status";
import { usePalette } from "@/theme/palette";

export default function SignInScreen() {
  const colors = usePalette();
  const { isOffline } = useNetworkStatus();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function signInWithGoogle() {
    if (signingIn || isOffline) return;
    setSigningIn(true);
    setError(null);
    setNotice(null);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/money"
      });
      if (result.error) throw new Error(result.error.message || "Google sign-in did not finish.");

      const restored = await authClient.getSession();
      if (restored.error) {
        throw new Error(restored.error.message || "Relay could not verify your session.");
      }
      if (!restored.data) {
        setNotice("Sign-in was canceled. Nothing changed.");
        return;
      }
      router.replace("/money");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign-in did not finish.");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <SafeAreaView className="bg-primary flex-1">
      <View className="flex-1 justify-between">
        <View className="px-6 pt-12">
          <View className="bg-accent mb-7 h-1 w-10" />
          <Text className="text-primary-foreground text-[34px] leading-10 font-semibold tracking-tight">
            Relay
          </Text>
          <Text className="text-primary-foreground mt-3 max-w-xs text-base leading-6 opacity-80">
            A clear daily record of money received and paid.
          </Text>
        </View>

        <View className="bg-canvas border-frame border-t px-6 pt-7 pb-8">
          <View className="mx-auto w-full max-w-md">
            <Text accessibilityRole="header" className="text-ink text-2xl font-semibold">
              Open your ledger
            </Text>
            <Text className="text-muted mt-2 text-sm leading-6">
              Continue with the Google account you use for Relay. A first sign-in creates your
              account.
            </Text>

            {isOffline ? (
              <View className="border-border bg-surface-muted rounded-control mt-5 flex-row items-start gap-3 border px-4 py-3">
                <WifiOff color={colors.muted} size={18} strokeWidth={1.8} />
                <Text className="text-muted min-w-0 flex-1 text-sm leading-5">
                  You are offline. Reconnect to sign in.
                </Text>
              </View>
            ) : null}

            {error ? (
              <View className="border-destructive bg-surface rounded-control mt-5 border px-4 py-3">
                <Text accessibilityRole="alert" className="text-destructive text-sm leading-5">
                  {error}
                </Text>
              </View>
            ) : null}

            {notice ? (
              <View className="border-border bg-surface rounded-control mt-5 border px-4 py-3">
                <Text accessibilityLiveRegion="polite" className="text-muted text-sm leading-5">
                  {notice}
                </Text>
              </View>
            ) : null}

            <AppButton
              className="mt-6 w-full"
              disabled={isOffline}
              icon={LogIn}
              loading={signingIn}
              onPress={() => void signInWithGoogle()}
            >
              Continue with Google
            </AppButton>

            <View className="mt-5 flex-row items-start gap-2">
              <ShieldCheck color={colors.muted} size={17} strokeWidth={1.8} />
              <Text className="text-muted min-w-0 flex-1 text-xs leading-5">
                Google identifies your account. Your ledger remains private to you.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
