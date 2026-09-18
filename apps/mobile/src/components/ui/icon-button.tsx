import type { LucideIcon } from "lucide-react-native";
import type { PressableProps } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon as ReusableIcon } from "@/components/ui/icon";

import { cn } from "@/lib/utils";

interface IconButtonProps extends PressableProps {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "destructive";
  className?: string;
}

export function IconButton({
  icon: Icon,
  label,
  tone = "default",
  disabled,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      className={cn(tone === "destructive" && "border-destructive", className)}
      {...props}
    >
      <ReusableIcon
        as={Icon}
        className={cn("size-[19px]", tone === "destructive" ? "text-destructive" : "text-primary")}
        strokeWidth={2}
      />
    </Button>
  );
}
