import type { LucideIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { type PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

import { Pressable } from "@/components/ui/pressable";
import { cn } from "@/lib/utils";
import { usePalette } from "@/theme/palette";
import { easeOut, isKeyboardPress } from "@/lib/animations/motion";
import { usePressMotion } from "@/lib/animations/use-press-motion";

/** Compact feedback inside a full 48px target; specific to the Money composition. */
export function MoneyIconAction({
  icon: Icon,
  label,
  disabled,
  className,
  onHoverIn,
  onHoverOut,
  onPressIn,
  onPressOut,
  ...props
}: PressableProps & {
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  const colors = usePalette();
  const reducedMotion = useReducedMotion();
  const feedback = useSharedValue(0);
  const press = usePressMotion(Boolean(disabled));
  const hovered = useRef(false);
  useEffect(() => {
    if (disabled) {
      hovered.current = false;
      feedback.set(0);
    }
  }, [disabled, feedback]);
  const background = useAnimatedStyle(() => ({ opacity: feedback.get() }));
  const show = (visible: boolean, immediate = false) => {
    feedback.set(
      withTiming(visible && !disabled ? 1 : 0, {
        duration: reducedMotion || immediate ? 0 : 110,
        easing: easeOut
      })
    );
  };
  return (
    <Pressable
      {...props}
      accessibilityLabel={label}
      disabled={disabled}
      className={cn("rounded-control h-12 w-12 shrink-0 items-center justify-center", className)}
      onHoverIn={(event) => {
        hovered.current = true;
        show(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        hovered.current = false;
        show(false);
        onHoverOut?.(event);
      }}
      onPressIn={(event) => {
        press.onPressIn(event);
        show(true, isKeyboardPress(event));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        press.onPressOut(event);
        show(hovered.current, isKeyboardPress(event));
        onPressOut?.(event);
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 30,
            height: 30,
            borderRadius: 6,
            backgroundColor: colors.selected
          },
          background
        ]}
      />
      <Animated.View accessible={false} style={press.style}>
        <Icon size={18} strokeWidth={1.8} color={colors.primary} />
      </Animated.View>
    </Pressable>
  );
}
