import { Text, TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithRef } from "react";
import { View } from "react-native";

// Adapted from React Native Reusables; see THIRD_PARTY_LICENSES.md.
type CardProps = ComponentPropsWithRef<typeof View>;

function Card({ className, ...props }: CardProps) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        className={cn("bg-card border-border rounded-card border py-4", className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function CardHeader({ className, ...props }: CardProps) {
  return <View className={cn("gap-1.5 px-4", className)} {...props} />;
}

function CardTitle({ className, ...props }: ComponentPropsWithRef<typeof Text>) {
  return (
    <Text
      accessibilityRole="header"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: ComponentPropsWithRef<typeof Text>) {
  return <Text className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

function CardContent({ className, ...props }: CardProps) {
  return <View className={cn("px-4", className)} {...props} />;
}

function CardFooter({ className, ...props }: CardProps) {
  return <View className={cn("flex-row items-center px-4", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
export type { CardProps };
