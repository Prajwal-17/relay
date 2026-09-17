// Adapted from React Native Reusables; see THIRD_PARTY_LICENSES.md.
import { Slot } from "@rn-primitives/slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { Text as NativeText } from "react-native";
import { cn } from "@/lib/utils";

const textVariants = cva("text-ink font-sans", {
  variants: {
    variant: {
      default: "",
      heading: "text-xl font-semibold tracking-tight",
      body: "text-base",
      small: "text-sm",
      muted: "text-muted text-sm"
    }
  },
  defaultVariants: { variant: "default" }
});

type TextProps = ComponentPropsWithRef<typeof NativeText> &
  VariantProps<typeof textVariants> & { asChild?: boolean };

/** All app copy uses the same Inter family as Relay Desktop. */
export function Text({ className, variant, asChild = false, ...props }: TextProps) {
  const Component = asChild ? Slot : NativeText;
  return (
    <Component
      accessibilityRole={variant === "heading" ? "header" : undefined}
      {...props}
      className={cn(textVariants({ variant }), className)}
    />
  );
}
