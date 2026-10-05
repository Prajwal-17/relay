import { useEffect, useRef } from "react";
import { Modal, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { Text } from "@/components/ui/text";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  pendingLabel?: string;
  loading?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  pendingLabel,
  loading = false,
  error,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  const actionLocked = useRef(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (open && !loading) actionLocked.current = false;
  }, [loading, open]);

  function confirmOnce() {
    if (actionLocked.current) return;
    actionLocked.current = true;
    onConfirm();
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={loading ? () => {} : onCancel}
      statusBarTranslucent
      navigationBarTranslucent
      accessibilityViewIsModal
    >
      <View className="flex-1">
        <StatusBar hidden={false} style="dark" />
        <View className="bg-background" style={{ height: insets.top }} />
        <View
          className="bg-scrim flex-1 justify-center px-5"
          style={{ paddingBottom: insets.bottom }}
        >
          <View
            accessibilityViewIsModal
            className="border-border-strong bg-card rounded-card w-full max-w-sm self-center border p-5 shadow-lg"
          >
            <Text accessibilityRole="header" className="text-foreground text-lg font-semibold">
              {title}
            </Text>
            <Text className="text-muted-foreground mt-2 text-sm leading-5">{message}</Text>
            {error ? (
              <Text accessibilityRole="alert" className="text-destructive mt-3 text-sm leading-5">
                {error}
              </Text>
            ) : null}
            <View className="mt-6 flex-row gap-3">
              <AppButton
                variant="outline"
                className="min-w-0 flex-1"
                disabled={loading}
                onPress={onCancel}
              >
                Cancel
              </AppButton>
              <AppButton
                variant="destructive"
                className="min-w-0 flex-1"
                loading={loading}
                loadingLabel={pendingLabel ?? `${confirmLabel}…`}
                onPress={confirmOnce}
              >
                {confirmLabel}
              </AppButton>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
