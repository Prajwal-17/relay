import { cn } from "@/lib/utils";
import { formatRupee } from "@shared/utils/utils";
import { Check, LockKeyhole, PenLine, QrCode, ReceiptText } from "lucide-react";
import { useId, type ReactNode } from "react";

export type ReceiptQrMode = "receipt" | "upi-open" | "upi-exact";

type ReceiptQrModeSelectorProps = {
  id: string;
  mode: ReceiptQrMode;
  onModeChange: (mode: ReceiptQrMode) => void;
  totalPaisa?: number | null;
  upiDisabled?: boolean;
  density?: "compact" | "comfortable";
};

type ModeCardProps = {
  active: boolean;
  disabled?: boolean;
  illustration: ReactNode;
  label: string;
  name: string;
  value: string;
  density: "compact" | "comfortable";
  onSelect: () => void;
};

function ModeCard({
  active,
  disabled = false,
  illustration,
  label,
  name,
  value,
  density,
  onSelect
}: ModeCardProps) {
  return (
    <label
      className={cn(
        "group relative block min-w-0",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <input
        type="radio"
        name={name}
        checked={active}
        disabled={disabled}
        aria-label={`${label}: ${value}`}
        onChange={onSelect}
        className="peer absolute top-1/2 left-1/2 m-0 size-px -translate-x-1/2 -translate-y-1/2 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
      />
      <span
        className={cn(
          "border-border peer-focus-visible:ring-ring relative flex w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-(--radius-panel) border px-2 text-center transition-colors peer-focus-visible:ring-2 peer-disabled:opacity-45",
          density === "compact" ? "min-h-24 py-2" : "min-h-32 py-3",
          !disabled && "group-hover:bg-hover",
          active && "border-primary bg-selected group-hover:bg-selected"
        )}
      >
        {illustration}
        <span className="text-foreground max-w-full truncate text-sm font-semibold">{label}</span>
        <span className="text-muted-foreground max-w-full truncate text-xs leading-4 tabular-nums">
          {value}
        </span>
        {active ? (
          <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full">
            <Check className="size-3" aria-hidden="true" />
          </span>
        ) : null}
      </span>
    </label>
  );
}

function ReceiptIllustration({
  mode,
  density
}: {
  mode: ReceiptQrMode;
  density: "compact" | "comfortable";
}) {
  const hasQr = mode !== "receipt";
  const isCompact = density === "compact";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "border-frame bg-background relative flex flex-col items-center rounded-(--radius-control) border px-1.5 py-1.5 shadow-xs",
        isCompact ? "h-11 w-10" : "h-14 w-12"
      )}
    >
      <span className="bg-border-strong mb-1 h-0.5 w-5 rounded-full" />
      <span className="bg-border mb-0.5 h-px w-7 rounded-full" />
      <span className="bg-border mb-auto h-px w-6 rounded-full" />
      {hasQr ? (
        <QrCode className={cn("text-foreground", isCompact ? "size-5" : "size-6")} />
      ) : (
        <ReceiptText className={cn("text-muted-foreground", isCompact ? "size-5" : "size-6")} />
      )}
      {mode === "upi-open" ? (
        <span className="bg-primary text-primary-foreground border-background absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2">
          <PenLine className="size-3" />
        </span>
      ) : null}
      {mode === "upi-exact" ? (
        <span className="bg-primary text-primary-foreground border-background absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2">
          <LockKeyhole className="size-3" />
        </span>
      ) : null}
    </span>
  );
}

export function ReceiptQrModeSelector({
  id,
  mode,
  onModeChange,
  totalPaisa,
  upiDisabled = false,
  density = "comfortable"
}: ReceiptQrModeSelectorProps) {
  const legendId = useId();
  const formattedTotal =
    totalPaisa === null || totalPaisa === undefined ? null : formatRupee(totalPaisa);

  return (
    <fieldset className="min-w-0">
      <legend id={legendId} className="text-foreground mb-2 text-sm font-semibold">
        Add a payment QR?
      </legend>
      <div className="grid min-w-0 grid-cols-3 gap-2" aria-labelledby={legendId}>
        <ModeCard
          active={mode === "receipt"}
          illustration={<ReceiptIllustration mode="receipt" density={density} />}
          label="No QR"
          name={id}
          value="Receipt only"
          density={density}
          onSelect={() => onModeChange("receipt")}
        />
        <ModeCard
          active={mode === "upi-open"}
          disabled={upiDisabled}
          illustration={<ReceiptIllustration mode="upi-open" density={density} />}
          label="Open amount"
          name={id}
          value={density === "compact" ? "Enter amount" : "Customer enters ₹"}
          density={density}
          onSelect={() => onModeChange("upi-open")}
        />
        <ModeCard
          active={mode === "upi-exact"}
          disabled={upiDisabled}
          illustration={<ReceiptIllustration mode="upi-exact" density={density} />}
          label="Exact total"
          name={id}
          value={
            formattedTotal
              ? density === "compact"
                ? formattedTotal
                : `${formattedTotal} fixed`
              : "Total fixed"
          }
          density={density}
          onSelect={() => onModeChange("upi-exact")}
        />
      </div>
    </fieldset>
  );
}
