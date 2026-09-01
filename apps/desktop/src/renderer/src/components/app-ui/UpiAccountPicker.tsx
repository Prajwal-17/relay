import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { UpiQrProfile } from "@shared/types";
import { Check, ChevronsUpDown, QrCode } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type UpiAccountPickerProps = {
  id?: string;
  profiles: UpiQrProfile[];
  selectedProfileId: string | null;
  defaultProfileId?: string | null;
  onProfileChange: (profileId: string) => void;
  "aria-labelledby"?: string;
  disabled?: boolean;
  compact?: boolean;
  showListDetails?: boolean;
  variant?: "popover" | "inline";
};

export function UpiAccountPicker({
  id,
  profiles,
  selectedProfileId,
  defaultProfileId,
  onProfileChange,
  disabled = false,
  compact = false,
  showListDetails = true,
  variant = "popover",
  "aria-labelledby": ariaLabelledBy
}: UpiAccountPickerProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const inlinePanelRef = useRef<HTMLDivElement>(null);
  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];

  useEffect(() => {
    if (!open || variant !== "inline") return;
    inlinePanelRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [open, variant]);

  if (!selectedProfile) return null;

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabelledBy ? undefined : "UPI account"}
      disabled={disabled}
      onClick={variant === "inline" ? () => setOpen((current) => !current) : undefined}
      className={cn(
        "w-full max-w-full min-w-0 justify-start overflow-hidden text-left font-normal",
        compact
          ? "h-9 min-h-9 gap-2 px-2 py-1.5"
          : "h-auto min-h-12 gap-2 px-2.5 py-2 whitespace-normal"
      )}
    >
      <span
        className={cn(
          "bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-(--radius-control)",
          compact && "hidden"
        )}
      >
        <QrCode className="size-4" aria-hidden="true" />
      </span>
      <span
        className={cn("min-w-0 flex-1 overflow-hidden", compact && "flex items-center gap-1.5")}
      >
        <span className="flex min-w-0 items-start gap-1.5">
          <span
            className={cn(
              "text-foreground min-w-0 flex-1 text-sm leading-4 font-semibold [overflow-wrap:anywhere] whitespace-normal",
              compact && "truncate whitespace-nowrap"
            )}
            title={selectedProfile.label}
          >
            {selectedProfile.label}
          </span>
          {!compact && selectedProfile.id === defaultProfileId ? (
            <span className="bg-muted text-muted-foreground shrink-0 rounded-(--radius-control) px-1.5 py-0.5 text-xs leading-none font-medium">
              Default
            </span>
          ) : null}
        </span>
        {!compact ? (
          <span
            className="text-muted-foreground mt-0.5 block text-xs leading-4 [overflow-wrap:anywhere] whitespace-normal"
            title={`${selectedProfile.upiId} · ${selectedProfile.payeeName}`}
          >
            {selectedProfile.upiId} · {selectedProfile.payeeName}
          </span>
        ) : null}
      </span>
      <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
    </Button>
  );

  const accountList = (
    <Command className="min-w-0">
      <CommandList id={listId} className="max-h-56 min-w-0">
        <CommandGroup className="min-w-0">
          {profiles.map((profile) => {
            const isSelected = profile.id === selectedProfile.id;
            return (
              <CommandItem
                key={profile.id}
                value={`${profile.label} ${profile.upiId} ${profile.payeeName}`}
                onSelect={() => {
                  onProfileChange(profile.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full max-w-full min-w-0 overflow-hidden",
                  showListDetails ? "items-start py-2 text-xs" : "items-center py-1.5 text-sm"
                )}
              >
                <Check
                  className={cn(
                    "size-4",
                    showListDetails && "mt-0.5",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-start gap-1.5">
                    <span className="text-foreground min-w-0 flex-1 text-sm leading-4 font-semibold [overflow-wrap:anywhere] whitespace-normal">
                      {profile.label}
                    </span>
                    {profile.id === defaultProfileId ? (
                      <span className="bg-muted text-muted-foreground shrink-0 rounded-(--radius-control) px-1.5 py-0.5 text-xs leading-none font-medium">
                        Default
                      </span>
                    ) : null}
                  </span>
                  {showListDetails ? (
                    <>
                      <span
                        className="text-muted-foreground mt-1 block leading-4 [overflow-wrap:anywhere] whitespace-normal"
                        title={profile.upiId}
                      >
                        {profile.upiId}
                      </span>
                      <span
                        className="text-muted-foreground mt-0.5 block leading-4 [overflow-wrap:anywhere] whitespace-normal"
                        title={profile.payeeName}
                      >
                        {profile.payeeName}
                      </span>
                    </>
                  ) : null}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (variant === "inline") {
    return (
      <div
        className="min-w-0"
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        {trigger}
        {open ? (
          <div
            ref={inlinePanelRef}
            data-upi-account-picker-inline
            className="border-border bg-popover mt-1 min-w-0 overflow-hidden rounded-(--radius-control) border shadow-xs"
          >
            {accountList}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] min-w-0 overflow-hidden p-0"
      >
        {accountList}
      </PopoverContent>
    </Popover>
  );
}
