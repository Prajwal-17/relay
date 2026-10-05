import { useEffect } from "react";
import type { GestureResponderEvent } from "react-native";
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

import { easeOut, isKeyboardPress } from "./motion";

/** Animate content inside a fixed touch target; keyboard presses stay immediate. */
export function usePressMotion(disabled = false) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (disabled || reducedMotion) scale.set(1);
  }, [disabled, reducedMotion, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return {
    style,
    onPressIn(event: GestureResponderEvent) {
      if (disabled || reducedMotion || isKeyboardPress(event)) return;
      scale.set(withTiming(0.97, { duration: 100, easing: easeOut }));
    },
    onPressOut(event: GestureResponderEvent) {
      scale.set(
        withTiming(1, {
          duration: disabled || reducedMotion || isKeyboardPress(event) ? 0 : 140,
          easing: easeOut
        })
      );
    }
  };
}
