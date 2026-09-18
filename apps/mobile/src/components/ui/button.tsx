import { Pressable } from "@/components/ui/pressable";
import { TextClassContext } from "@/components/ui/text";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";

import { cn } from "@/lib/utils";

// Adapted from React Native Reusables; see THIRD_PARTY_LICENSES.md.
const buttonVariants = cva(
  "group rounded-control shrink-0 flex-row items-center justify-center gap-2 border web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-ring",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary web:hover:bg-primary-hover",
        outline: "border-border bg-background active:bg-accent web:hover:bg-accent",
        secondary: "border-secondary bg-secondary active:opacity-80",
        ghost: "border-transparent bg-transparent active:bg-accent web:hover:bg-accent",
        link: "border-transparent bg-transparent",
        destructive: "border-destructive bg-destructive active:opacity-90"
      },
      size: {
        default: "min-h-12 px-4",
        sm: "min-h-12 px-4",
        lg: "min-h-12 px-6",
        icon: "min-h-12 min-w-12"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

const buttonTextVariants = cva("text-foreground shrink text-center font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      outline: "group-active:text-accent-foreground",
      secondary: "text-secondary-foreground",
      ghost: "group-active:text-accent-foreground",
      link: "text-primary underline-offset-4 web:hover:underline",
      destructive: "text-destructive-foreground"
    },
    size: { default: "text-[15px]", sm: "text-[13px]", lg: "text-[15px]", icon: "text-[15px]" }
  },
  defaultVariants: { variant: "default", size: "default" }
});

type ButtonProps = ComponentPropsWithRef<typeof Pressable> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, disabled, accessibilityState, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ ...accessibilityState, disabled: Boolean(disabled) }}
        disabled={disabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
