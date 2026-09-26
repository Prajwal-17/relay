import type { LucideIcon } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, type PressableProps } from "react-native";
import { Button } from "@/components/ui/button";
import { Icon as ReusableIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

import { usePalette } from "@/theme/palette";

type ButtonVariant = "primary" | "outline" | "ghost" | "destructive";

interface AppButtonProps extends Omit<PressableProps, "children">, PropsWithChildren {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  loadingLabel?: string;
  compact?: boolean;
  className?: string;
}

export function AppButton({
  variant = "primary",
  icon: Icon,
  loading = false,
  loadingLabel,
  compact = false,
  disabled,
  className,
  children,
  ...props
}: AppButtonProps) {
  const colors = usePalette();
  const loadingColors: Record<ButtonVariant, string> = {
    primary: colors["primary-foreground"],
    outline: colors.foreground,
    ghost: colors["muted-foreground"],
    destructive: colors["destructive-foreground"]
  };
  const isDisabled = disabled || loading;
  const baseVariant = variant === "primary" ? "default" : variant;
  const size = compact ? "sm" : "default";

  return (
    <Button
      variant={baseVariant}
      size={size}
      accessibilityState={{ disabled: Boolean(isDisabled), busy: loading }}
      disabled={isDisabled}
      className={className}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={loadingColors[variant]} size="small" />
      ) : Icon ? (
        <ReusableIcon as={Icon} className="size-[18px]" strokeWidth={2} />
      ) : null}
      <Text>{loading && loadingLabel ? loadingLabel : children}</Text>
    </Button>
  );
}
