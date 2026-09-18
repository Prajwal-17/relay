import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { LogOut, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth/auth-client";
import { usePalette } from "@/theme/palette";

export default function ProfileScreen() {
  const colors = usePalette();
  const session = authClient.useSession();
  const queryClient = useQueryClient();
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const signOut = useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message || "Could not sign out.");
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.clear();
    }
  });

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top", "left", "right"]}>
      <ConfirmDialog
        open={signOutDialogOpen}
        title="Sign out of Relay?"
        message="You will need to sign in with Google to see your money again."
        confirmLabel="Sign out"
        pendingLabel="Signing out…"
        loading={signOut.isPending}
        error={signOut.error?.message ?? null}
        onCancel={() => setSignOutDialogOpen(false)}
        onConfirm={() => {
          signOut.mutate();
        }}
      />
      <View className="mx-auto w-full max-w-xl px-4 pt-4">
        <View className="border-frame bg-card rounded-card border p-4">
          <View className="flex-row items-center gap-3">
            <View className="bg-counter-accent-soft h-12 w-12 items-center justify-center rounded-full">
              <Text className="text-counter-accent-foreground text-lg font-bold">
                {(session.data?.user.name || "R").trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-foreground text-base font-semibold" numberOfLines={2}>
                {session.data?.user.name || "Relay account"}
              </Text>
              {session.data?.user.email ? (
                <Text className="text-muted-foreground mt-0.5 text-sm" selectable>
                  {session.data.user.email}
                </Text>
              ) : null}
            </View>
          </View>
          <View className="border-border mt-5 flex-row items-center gap-2 border-t pt-4">
            <ShieldCheck color={colors["sales-ink"]} size={18} strokeWidth={1.9} />
            <Text className="text-muted-foreground min-w-0 flex-1 text-sm">
              Signed in securely with Google
            </Text>
          </View>
        </View>
        <View className="mt-5">
          <AppButton
            icon={LogOut}
            variant="outline"
            loading={signOut.isPending}
            loadingLabel="Signing out…"
            className="w-full"
            onPress={() => {
              signOut.reset();
              setSignOutDialogOpen(true);
            }}
          >
            Sign out
          </AppButton>
        </View>
        {signOut.error ? (
          <Text accessibilityRole="alert" className="text-destructive mt-3 text-sm">
            {signOut.error.message}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
