import { Label } from "@/components/ui/label";
import type { ReactNode } from "react";

type SettingsFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export const SettingsField = ({ label, hint, children }: SettingsFieldProps) => {
  return (
    <div className="grid gap-3 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] lg:items-start">
      <div className="space-y-1.5">
        <Label className="text-foreground text-lg font-semibold tracking-tight">{label}</Label>
        {hint ? <p className="text-muted-foreground text-base leading-6">{hint}</p> : null}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
};
