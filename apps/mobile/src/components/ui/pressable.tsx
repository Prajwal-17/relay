import type { ComponentPropsWithRef } from "react";
import { Pressable as NativePressable } from "react-native";
import { cn } from "@/lib/utils";

/** Unframed actions, rows and composite controls share focus and press feedback. */
export function Pressable({
  className,
  disabled,
  accessibilityState,
  style,
  ...props
}: ComponentPropsWithRef<typeof NativePressable>) {
  return (
    <NativePressable
      accessibilityRole="button"
      {...props}
      disabled={disabled}
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      className={cn(
        "web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus",
        className,
        disabled ? "opacity-50" : "active:opacity-80"
      )}
      style={style}
    />
  );
}
