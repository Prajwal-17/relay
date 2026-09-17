import type { LucideIcon } from "lucide-react-native";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, type PressableProps } from "react-native";
import { Button, buttonTextVariants } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { usePalette } from "@/theme/palette";

type ButtonVariant = "primary" | "outline" | "ghost" | "destructive";

interface AppButtonProps extends Omit<PressableProps, "children">, PropsWithChildren {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

export function AppButton({
  variant = "primary",
  icon: Icon,
  loading = false,
  compact = false,
  disabled,
  className,
  children,
  ...props
}: AppButtonProps) {
  const colors = usePalette();
  const iconColors: Record<ButtonVariant, string> = {
    primary: colors["primary-foreground"],
    outline: colors.ink,
    ghost: colors.muted,
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
        <ActivityIndicator color={iconColors[variant]} size="small" />
      ) : Icon ? (
        <Icon color={iconColors[variant]} size={18} strokeWidth={2} />
      ) : null}
      <Text className={buttonTextVariants({ variant: baseVariant, size })}>{children}</Text>
    </Button>
  );
}
