import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  formatTransactionDateRange,
  getActiveDatePreset,
  getDatePreset,
  QUICK_DATE_PRESETS,
  SECONDARY_DATE_PRESETS,
  type DatePresetValue
} from "@/features/transactions/datePresets.constants";
import { useDateRangePicker } from "@/features/transactions/hooks/useDateRangePicker";
import { cn } from "@/lib/utils";
import { DASHBOARD_TYPE, type DashboardType } from "@shared/types";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";

const QUICK_PRESET_LABELS: Record<(typeof QUICK_DATE_PRESETS)[number], string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7days: "7 days"
};

export const DateRangePicker = ({ type }: { type: DashboardType }) => {
  const {
    open,
    date,
    setDate,
    dropdown,
    formatters,
    handleApplyDateRange,
    handleOpenChange,
    handleCancel,
    handleOnDateSelect,
    tempDate,
    setTempDate,
    canApply
  } = useDateRangePicker();

  const activePreset = getActiveDatePreset(date);
  const tempPreset = getActiveDatePreset(tempDate);
  const isQuickPreset = activePreset
    ? QUICK_DATE_PRESETS.includes(activePreset as (typeof QUICK_DATE_PRESETS)[number])
    : false;
  const isCustomActive = !isQuickPreset;
  const activeClass =
    type === DASHBOARD_TYPE.SALES
      ? "z-10 border-sales bg-sales-soft text-sales-foreground"
      : "z-10 border-estimate bg-estimate-soft text-estimate-foreground";
  const baseButtonClass =
    "border-border bg-card text-foreground hover:bg-hover focus-visible:z-20 relative -ml-px inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-none border px-3 text-sm font-semibold whitespace-nowrap transition-colors first:ml-0 first:rounded-l-(--radius-control)";

  const applyQuickPreset = (presetValue: DatePresetValue) => {
    setDate(getDatePreset(presetValue).getRange());
  };

  return (
    <div
      className="isolate flex h-10 shrink-0 items-center justify-self-end"
      aria-label="Transaction date range"
    >
      {QUICK_DATE_PRESETS.map((presetValue) => {
        const isActive = activePreset === presetValue;
        return (
          <button
            key={presetValue}
            type="button"
            aria-pressed={isActive}
            className={cn(baseButtonClass, isActive && activeClass)}
            onClick={() => applyQuickPreset(presetValue)}
          >
            {QUICK_PRESET_LABELS[presetValue]}
          </button>
        );
      })}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={
              isCustomActive
                ? `Change custom date range, currently ${formatTransactionDateRange(date)}`
                : "Choose a custom date range"
            }
            aria-pressed={isCustomActive}
            title={isCustomActive ? formatTransactionDateRange(date) : undefined}
            className={cn(
              baseButtonClass,
              "min-w-24 rounded-r-(--radius-control) px-3 first:rounded-l-none",
              isCustomActive && "min-w-64",
              isCustomActive && activeClass
            )}
          >
            <CalendarIcon className="size-4" aria-hidden="true" />
            <span className="whitespace-nowrap">
              {isCustomActive ? formatTransactionDateRange(date) : "Custom"}
            </span>
            <ChevronDownIcon className="size-3.5 opacity-65" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="border-frame max-h-(--radix-popover-content-available-height) w-auto space-y-2.5 overflow-y-auto p-3 shadow-md"
          align="end"
        >
          <div className="border-border flex items-center justify-between gap-3 border-b pb-2.5">
            <span className="text-muted-foreground text-xs font-medium">Extended ranges</span>
            <div className="flex items-center gap-1">
              {SECONDARY_DATE_PRESETS.map((presetValue) => {
                const preset = getDatePreset(presetValue);
                const isSelected = tempPreset === presetValue;
                return (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    key={presetValue}
                    className={cn(
                      "h-7 cursor-pointer px-2 text-xs font-medium",
                      isSelected && "border-marker bg-selected text-foreground"
                    )}
                    onClick={() => setTempDate(preset.getRange())}
                  >
                    {presetValue === "last30days" ? "30 days" : "90 days"}
                  </Button>
                );
              })}
            </div>
          </div>

          <Calendar
            mode="range"
            formatters={formatters as any}
            defaultMonth={tempDate?.from}
            disabled={{ after: new Date() }}
            selected={tempDate}
            required
            onSelect={handleOnDateSelect}
            captionLayout={dropdown}
            className="p-0"
            classNames={{ day_button: "transition-none" }}
            numberOfMonths={2}
          />

          <div className="border-border flex w-full items-center justify-end gap-2 border-t pt-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyDateRange}
              disabled={!canApply}
              className="hover:bg-primary-hover cursor-pointer"
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
