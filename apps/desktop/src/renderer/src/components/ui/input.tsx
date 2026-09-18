import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-context-placeholder selection:bg-primary selection:text-primary-foreground border-context-border bg-context-control text-context-foreground read-only:bg-context-hover read-only:border-context-border read-only:hover:border-context-border hover:border-context-border-hover flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base transition-[color,background-color,border-color,box-shadow] duration-150 ease-out outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:font-normal disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-context-focus focus-visible:hover:border-context-focus focus-visible:ring-context-focus focus-visible:ring-2",
        "aria-invalid:ring-destructive aria-invalid:border-destructive aria-invalid:hover:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
