import { Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { View, type GestureResponderEvent } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { usePalette } from "@/theme/palette";
import { easeOut, isKeyboardPress } from "@/lib/animations/motion";
import { usePressMotion } from "@/lib/animations/use-press-motion";
import { ENTRY_PROVIDERS } from "../payment-catalog";
import type { PaymentMethod } from "../money.types";
import { PaymentIcon } from "./payment-icon";

function MethodChoice({
  id,
  name,
  selected,
  disabled,
  animateSelection,
  onSelect
}: {
  id: number | null;
  name: string;
  selected: boolean;
  disabled: boolean;
  animateSelection: boolean;
  onSelect: (id: number | null, event: GestureResponderEvent) => void;
}) {
  const colors = usePalette();
  const reduced = useReducedMotion();
  const progress = useSharedValue(selected ? 1 : 0);
  const press = usePressMotion(disabled);
  useEffect(() => {
    progress.set(
      withTiming(selected ? 1 : 0, {
        duration: reduced || !animateSelection ? 0 : 120,
        easing: easeOut
      })
    );
  }, [animateSelection, progress, reduced, selected]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.get(),
      [0, 1],
      [colors.card, colors["counter-accent-soft"]]
    ),
    borderColor: interpolateColor(progress.get(), [0, 1], [colors.frame, colors["counter-accent"]])
  }));
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`Receive via ${name}`}
      accessibilityState={{ selected, checked: selected }}
      disabled={disabled}
      onPress={(event) => onSelect(id, event)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      className="rounded-control min-w-[80px] flex-1"
    >
      <Animated.View
        className="rounded-control min-h-[82px] items-center justify-center gap-1 border px-1 py-2"
        style={[style, press.style]}
      >
        <PaymentIcon name={name} kind={id === null ? "cash" : "upi"} compact />
        <Text
          className={
            selected
              ? "text-counter-accent-foreground text-[13px] font-semibold"
              : "text-foreground text-[13px] font-semibold"
          }
        >
          {name}
        </Text>
        {selected ? (
          <View className="absolute top-1 right-1">
            <Check size={14} color={colors["counter-accent-foreground"]} strokeWidth={2} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export function ReceivedMethodPicker({
  methods,
  selectedId,
  disabled,
  onSelect
}: {
  methods: PaymentMethod[];
  selectedId: number | null;
  disabled: boolean;
  onSelect: (id: number | null) => void;
}) {
  const [animateSelection, setAnimateSelection] = useState(true);
  return (
    <View className="gap-1.5">
      <Text className="text-foreground text-sm font-medium">Received via</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Received via"
        className="flex-row flex-wrap gap-2"
      >
        {[
          { id: null, name: "Cash", available: true },
          ...ENTRY_PROVIDERS.map((name) => {
            const method = methods.find((method) => method.name === name && !method.isArchived);
            return { id: method?.id ?? -1, name, available: Boolean(method) };
          }),
          ...methods
            .filter(
              (method) => method.isArchived || !ENTRY_PROVIDERS.some((name) => name === method.name)
            )
            .map((method) => ({ id: method.id, name: method.name, available: true }))
        ].map((method) => (
          <MethodChoice
            key={`${method.id}:${method.name}`}
            id={method.id}
            name={method.name}
            selected={selectedId === method.id}
            disabled={disabled || !method.available}
            animateSelection={animateSelection}
            onSelect={(id, event) => {
              setAnimateSelection(!isKeyboardPress(event));
              onSelect(id);
            }}
          />
        ))}
      </View>
    </View>
  );
}
