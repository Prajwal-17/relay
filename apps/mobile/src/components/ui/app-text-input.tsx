import { useState } from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Shared distinction between empty-field hints and actual entered values. */
export function AppTextInput({
  value,
  defaultValue = "",
  onChangeText,
  className,
  ...props
}: InputProps) {
  const [draft, setDraft] = useState(defaultValue);
  const current = value ?? draft;
  return (
    <Input
      {...props}
      value={current}
      onChangeText={(text) => {
        if (value === undefined) setDraft(text);
        onChangeText?.(text);
      }}
      className={cn(
        "font-sans",
        className,
        "text-ink",
        current.length ? "font-semibold" : "font-normal"
      )}
    />
  );
}
