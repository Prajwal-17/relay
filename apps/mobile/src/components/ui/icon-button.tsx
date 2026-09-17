import { usePalette } from "@/theme/palette";
import type { LucideIcon } from "lucide-react-native";
import type { PressableProps } from "react-native";
import { Button } from "@/components/ui/button";

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
  const colors = usePalette();
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
      <Icon
        color={tone === "destructive" ? colors["destructive"] : colors["primary"]}
        size={19}
        strokeWidth={2}
      />
    </Button>
  );
}
