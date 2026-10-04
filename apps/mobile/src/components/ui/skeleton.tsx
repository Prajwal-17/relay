import { useEffect, type ComponentPropsWithRef } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";

import { cn } from "@/lib/utils";

// Adapted from React Native Reusables' UniWind registry; see THIRD_PARTY_LICENSES.md.
export function Skeleton({
  className,
  style,
  ...props
}: ComponentPropsWithRef<typeof Animated.View>) {
  const opacity = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    opacity.value = reducedMotion ? 1 : withRepeat(withTiming(0.5, { duration: 1000 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reducedMotion]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      accessible={false}
      aria-hidden
      className={cn("bg-muted rounded-control", className)}
      style={[animatedStyle, style]}
      {...props}
    />
  );
}
