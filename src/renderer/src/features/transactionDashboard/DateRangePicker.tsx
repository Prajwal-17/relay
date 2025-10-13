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
    tempDate,
    setTempDate,
    dropdown,
    selectedPreset,
    setSelectedPreset,
    calendarClassNames,
    formatters,
    handleApplyDateRange,
    handleCancel,
    handleOnDateSelect
  } = useDateRangePicker();

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="my-2 flex justify-between">
              <div />
              <button className="bg-secondary text-foreground flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-lg font-medium">
                <CalendarIcon className="text-foreground" size={20} />
                {date?.from?.toLocaleDateString("en-IN", {
                  dateStyle: "medium"
                })}
                <MoveRight />
                {date?.to?.toLocaleDateString("en-IN", {
                  dateStyle: "medium"
                })}
                <ChevronDownIcon />
              </button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto space-y-6 overflow-hidden px-6 py-6" align="end">
            <div className="flex flex-wrap gap-2">
              {calendarPresets.map((preset, idx) => (
                <Button
                  variant={selectedPreset === preset.value ? "default" : "outline"}
                  size="sm"
                  key={idx}
                  className={`cursor-pointer font-semibold transition-all duration-200 ${selectedPreset === preset.value ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent hover:text-accent-foreground"}`}
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
                formatters={formatters}
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
            <div className="flex w-full items-center justify-end gap-3 font-medium">
              <Button variant="outline" onClick={handleCancel} className="cursor-pointer">
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleApplyDateRange}
                className="hover:bg-primary/80 cursor-pointer"
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};
