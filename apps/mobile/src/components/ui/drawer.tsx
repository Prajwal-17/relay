import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable as NativePressable,
  View
} from "react-native";

import { SafeAreaView } from "@/components/ui/safe-area-view";

interface DrawerProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  label: string;
}

/** A content-sized bottom drawer shared by native and web. */
export function Drawer({ open, onClose, label, children }: DrawerProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-end">
          <NativePressable
            accessibilityLabel={`Close ${label}`}
            accessibilityRole="button"
            className="bg-scrim absolute inset-0"
            onPress={onClose}
          />
          <SafeAreaView
            className="bg-card w-full max-w-xl self-center overflow-hidden rounded-t-2xl"
            edges={["bottom"]}
            style={{ flexShrink: 1, maxHeight: "100%" }}
          >
            <View className="items-center pt-2 pb-1">
              <View className="bg-frame h-1 w-9 rounded-full" />
            </View>
            {children}
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
