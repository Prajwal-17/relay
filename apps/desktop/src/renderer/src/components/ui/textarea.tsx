import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-context-border placeholder:text-context-placeholder focus-visible:border-context-focus focus-visible:hover:border-context-focus focus-visible:ring-context-focus aria-invalid:ring-destructive aria-invalid:border-destructive aria-invalid:hover:border-destructive bg-context-control text-context-foreground hover:border-context-border-hover flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base transition-[color,background-color,border-color,box-shadow] duration-150 ease-out outline-none placeholder:font-normal focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
