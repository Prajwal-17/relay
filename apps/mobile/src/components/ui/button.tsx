import { Pressable } from "@/components/ui/pressable";
// Adapted from React Native Reusables; see THIRD_PARTY_LICENSES.md.
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "rounded-control shrink-0 flex-row items-center justify-center gap-2 border web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary web:hover:bg-primary-hover",
        outline: "border-border bg-surface web:hover:bg-hover",
        ghost: "border-transparent bg-transparent web:hover:bg-hover",
        destructive: "border-destructive bg-destructive"
      },
      size: {
        default: "min-h-12 px-4",
        sm: "min-h-11 px-4",
        icon: "min-h-11 min-w-11"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

const buttonTextVariants = cva("shrink text-center font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      outline: "text-ink",
      ghost: "text-muted",
      destructive: "text-destructive-foreground"
    },
    size: { default: "text-base", sm: "text-sm", icon: "text-base" }
  },
  defaultVariants: { variant: "default", size: "default" }
});

type ButtonProps = ComponentPropsWithRef<typeof Pressable> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, disabled, accessibilityState, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
