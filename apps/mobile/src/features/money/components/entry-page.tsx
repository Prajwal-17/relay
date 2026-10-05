import { useFocusEffect } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import {
  useCallback,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
  type RefObject
} from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, type TextInput } from "react-native";

import { SafeAreaView } from "@/components/ui/safe-area-view";
import { Text } from "@/components/ui/text";
import { formatDisplayDate } from "@/lib/format/dates";
import type { LocalDate } from "../money.types";
import { MoneyIconAction } from "./money-icon-action";

export function EntryPage({
  title,
  date,
  onBack,
  saving = false,
  initialFocusRef,
  footer,
  children
}: PropsWithChildren<{
  title: string;
  date: LocalDate | null;
  onBack: () => void;
  saving?: boolean;
  initialFocusRef?: RefObject<TextInput | null>;
  footer?: ReactNode;
}>) {
  const rootRef = useRef<View>(null);
  const [keyboardVerticalOffset, setKeyboardVerticalOffset] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const frame = requestAnimationFrame(() => initialFocusRef?.current?.focus());
      return () => cancelAnimationFrame(frame);
    }, [initialFocusRef])
  );

  return (
    <View
      ref={rootRef}
      collapsable={false}
      className="bg-card flex-1"
      onLayout={() => {
        // Keyboard screenY is in window coordinates, including any native screen inset.
        rootRef.current?.measureInWindow((_x, y) => setKeyboardVerticalOffset(Math.max(0, y)));
      }}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "web" ? undefined : "padding"}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
          <View className="border-border shrink-0 border-b">
            <View className="w-full max-w-xl flex-row items-center gap-2 self-center px-4 py-2">
              <MoneyIconAction
                icon={ArrowLeft}
                label="Back to Money"
                disabled={saving}
                onPress={onBack}
              />
              <View className="min-w-0 flex-1">
                <Text accessibilityRole="header" className="text-foreground text-lg font-semibold">
                  {title}
                </Text>
                {date ? (
                  <Text className="text-muted-foreground mt-0.5 text-xs">
                    {formatDisplayDate(date)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerClassName="items-center px-5 pt-4 pb-6"
          >
            <View className="w-full max-w-xl gap-3">{children}</View>
          </ScrollView>
          {footer ? (
            <View
              testID="money-entry-save-footer"
              className="border-border bg-card shrink-0 border-t px-5 py-3"
            >
              <View className="w-full max-w-xl self-center">{footer}</View>
            </View>
          ) : null}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
