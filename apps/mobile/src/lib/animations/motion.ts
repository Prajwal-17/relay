import type { GestureResponderEvent } from "react-native";
import { Easing } from "react-native-reanimated";

export const easeOut = Easing.bezier(0.23, 1, 0.32, 1);
export const easeDrawer = Easing.bezier(0.32, 0.72, 0, 1);

export function isKeyboardPress(event: GestureResponderEvent) {
  const native = event.nativeEvent ?? {};
  return (
    "key" in event ||
    "key" in native ||
    ("type" in native && native.type === "click" && "detail" in native && native.detail === 0)
  );
}
