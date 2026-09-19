import type { PropsWithChildren } from "react";
import { View, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";

interface LedgerCardProps extends PropsWithChildren, ViewProps {
  className?: string;
}

export function LedgerCard({ className, children, ...props }: LedgerCardProps) {
  return (
    <View
      className={cn("border-border bg-surface rounded-card overflow-hidden border", className)}
      {...props}
    >
      {children}
    </View>
  );
}
