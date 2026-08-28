import * as React from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function CompactCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card className={cn("gap-3 rounded-(--radius-panel) py-3 shadow-none", className)} {...props} />
  );
}

function CompactCardHeader({ className, ...props }: React.ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn("gap-1.5 px-3 [.border-b]:pb-3", className)} {...props} />;
}

function CompactCardContent({ className, ...props }: React.ComponentProps<typeof CardContent>) {
  return <CardContent className={cn("px-3", className)} {...props} />;
}

function CompactCardFooter({ className, ...props }: React.ComponentProps<typeof CardFooter>) {
  return <CardFooter className={cn("px-3 [.border-t]:pt-3", className)} {...props} />;
}

export {
  CompactCard,
  CompactCardHeader,
  CompactCardContent,
  CompactCardFooter,
  CardAction,
  CardDescription,
  CardTitle
};
