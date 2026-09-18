import { Slot } from "@rn-primitives/slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Text as NativeText } from "react-native";

import { cn } from "@/lib/utils";

// Adapted from React Native Reusables; see THIRD_PARTY_LICENSES.md.
const textVariants = cva("text-foreground font-sans", {
  variants: {
    variant: {
      default: "",
      heading: "text-lg font-semibold tracking-tight",
      body: "text-[15px]",
      small: "text-[13px]",
      muted: "text-muted-foreground text-[13px]"
    }
  },
  defaultVariants: { variant: "default" }
});

type TextProps = React.ComponentPropsWithRef<typeof NativeText> &
  VariantProps<typeof textVariants> & { asChild?: boolean };

const TextClassContext = React.createContext<string | undefined>(undefined);

/** All app copy uses the same Inter family as Relay Desktop. */
export function Text({ className, variant, asChild = false, ...props }: TextProps) {
  const inheritedClassName = React.useContext(TextClassContext);
  const Component = asChild ? Slot : NativeText;
  return (
    <Component
      accessibilityRole={variant === "heading" ? "header" : undefined}
      {...props}
      className={cn(textVariants({ variant }), inheritedClassName, className)}
    />
  );
}

export { TextClassContext, textVariants };
export type { TextProps };
