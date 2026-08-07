import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calendarPresets } from "@/features/transactions/datePresets.constants";
import { useDateRangePicker } from "@/features/transactions/hooks/useDateRangePicker";
import { CalendarIcon, ChevronDownIcon, MoveRight } from "lucide-react";

export const DateRangePicker = () => {
  const {
    open,
    setOpen,
    date,
    dropdown,
    selectedPreset,
    setSelectedPreset,
    formatters,
    handleApplyDateRange,
    handleCancel,
    handleOnDateSelect,
    tempDate,
    setTempDate
  } = useDateRangePicker();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="bg-secondary text-foreground hover:bg-secondary/80 flex h-8 cursor-pointer items-center gap-1.5 rounded-(--radius-control) px-2.5 text-sm font-medium">
          <CalendarIcon className="text-foreground size-4" />
          {date?.from?.toLocaleDateString("en-IN", {
            dateStyle: "medium"
          })}
          <MoveRight className="text-muted-foreground size-3.5" />
          {date?.to?.toLocaleDateString("en-IN", {
            dateStyle: "medium"
          })}
          <ChevronDownIcon className="text-muted-foreground size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-(--radix-popover-content-available-height) w-auto space-y-2.5 overflow-y-auto p-3"
        align="end"
      >
        <div className="grid grid-cols-5 gap-1">
          {calendarPresets.map((preset, idx) => (
            <Button
              variant={selectedPreset === preset.value ? "default" : "outline"}
              size="sm"
              key={idx}
              className={`h-7 cursor-pointer px-2 text-xs font-medium ${selectedPreset === preset.value ? "" : "hover:bg-accent hover:text-accent-foreground"}`}
              onClick={() => {
                const dateValue = preset.getRange();
                setTempDate(dateValue);
                setSelectedPreset(preset.value);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div>
          <Calendar
            mode="range"
            formatters={formatters as any}
            defaultMonth={tempDate?.from}
            disabled={{ after: new Date() }}
            selected={tempDate}
            required={true}
            onSelect={(range) => handleOnDateSelect(range)}
            captionLayout={dropdown}
            className="p-0"
            classNames={{
              day_button:
                "transition-none data-[selected-single=true]:hover:bg-primary data-[selected-single=true]:hover:text-primary-foreground data-[range-start=true]:hover:bg-primary data-[range-start=true]:hover:text-primary-foreground data-[range-end=true]:hover:bg-primary data-[range-end=true]:hover:text-primary-foreground"
            }}
            numberOfMonths={2}
          />
        </div>
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleApplyDateRange}
            className="hover:bg-primary-hover cursor-pointer"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
