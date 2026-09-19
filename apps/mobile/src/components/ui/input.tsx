// Adapted from React Native Reusables; see THIRD_PARTY_LICENSES.md.
import { cva, type VariantProps } from "class-variance-authority";
import { useState, type ComponentPropsWithRef } from "react";
import { TextInput } from "react-native";
import { cn } from "@/lib/utils";
import { usePalette } from "@/theme/palette";

const inputVariants = cva("text-ink font-sans", {
  variants: {
    variant: {
      default:
        "rounded-control border-border bg-surface min-h-12 min-w-0 border px-3 py-2 text-base web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-focus",
      // Composite fields (search, currency) own their border and focus treatment.
      bare: ""
    }
  },
  defaultVariants: { variant: "default" }
});

type InputProps = ComponentPropsWithRef<typeof TextInput> & VariantProps<typeof inputVariants>;

function Input({ className, variant = "default", onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const colors = usePalette();
  return (
    <TextInput
      placeholderTextColor={colors.placeholder}
      selectionColor={colors.focus}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      className={cn(
        inputVariants({ variant }),
        props.editable === false && "opacity-50",
        variant === "default" && focused && "border-focus",
        className
      )}
      {...props}
    />
  );
}

export { Input, inputVariants };
export type { InputProps };
