import { IndianRupee } from "lucide-react-native";
import { usePalette } from "@/theme/palette";
import { AppTextInput } from "@/components/ui/app-text-input";
import { useRef, useState, type RefObject } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { Text } from "@/components/ui/text";

import { cn } from "@/lib/utils";

interface AmountInputProps extends Omit<
  TextInputProps,
  "keyboardType" | "inputMode" | "placeholder"
> {
  label: string;
  error?: string;
  containerClassName?: string;
  inputRef?: RefObject<TextInput | null>;
}

export function AmountInput({
  label,
  error,
  containerClassName,
  className,
  onFocus,
  onBlur,
  onChangeText,
  inputRef: suppliedRef,
  ...props
}: AmountInputProps) {
  const colors = usePalette();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const ref = suppliedRef ?? inputRef;

  function focusInput() {
    if (props.editable !== false) ref.current?.focus();
  }

  return (
    <View className={cn("gap-1.5", containerClassName)}>
      <Pressable
        accessible={false}
        className={cn(
          "rounded-control min-h-12 flex-row items-center gap-2 border px-3",
          focused ? "bg-card border-ring" : "bg-background border-border",
          error && "border-destructive"
        )}
        onPress={focusInput}
      >
        <View accessible={false} aria-hidden className="pointer-events-none shrink-0">
          <IndianRupee size={20} strokeWidth={1.8} color={colors["muted-foreground"]} />
        </View>
        <AppTextInput
          {...props}
          ref={ref}
          variant="bare"
          accessibilityLabel={label}
          aria-invalid={Boolean(error)}
          className={cn(
            "text-foreground min-h-12 min-w-0 flex-1 text-left text-lg font-medium tabular-nums outline-none",
            className
          )}
          inputMode="decimal"
          keyboardType="decimal-pad"
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
          style={[props.style, { includeFontPadding: false, paddingVertical: 0 }]}
          textAlignVertical="center"
          // Preserve the native draft: rolling back rejected edits can leave an
          // Android keyboard composing stale text. The form validates before save.
          onChangeText={onChangeText}
          showSoftInputOnFocus
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-destructive text-sm leading-5">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
