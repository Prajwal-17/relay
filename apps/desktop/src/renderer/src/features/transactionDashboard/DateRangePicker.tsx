import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calendarPresets } from "@/constants/calendarPresets";
import { useDateRangePicker } from "@/hooks/dashboard/useDateRangePicker";
import { CalendarIcon, ChevronDownIcon, MoveRight } from "lucide-react";

export const DateRangePicker = () => {
  const {
    open,
    setOpen,
    date,
    dropdown,
    selectedPreset,
    setSelectedPreset,
    calendarClassNames,
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
        <button className="bg-secondary text-foreground hover:bg-secondary/80 flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium">
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
      <PopoverContent className="w-auto space-y-4 px-4 py-4" align="end">
        <div className="flex flex-wrap gap-1.5">
          {calendarPresets.map((preset, idx) => (
            <Button
              variant={selectedPreset === preset.value ? "default" : "outline"}
              size="sm"
              key={idx}
              className={`cursor-pointer font-medium ${selectedPreset === preset.value ? "" : "hover:bg-accent hover:text-accent-foreground"}`}
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
            classNames={calendarClassNames}
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
