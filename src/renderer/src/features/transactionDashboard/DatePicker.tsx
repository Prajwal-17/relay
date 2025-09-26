import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDashboardStore } from "@/store/salesStore";
import type { DateRangeType } from "@shared/types";
import { CalendarIcon, ChevronDownIcon, MoveRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

export const DatePicker = ({ selected }: { selected: string }) => {
  const location = useLocation();
  const pathname = location.pathname;
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(InitialDate());
  const setSales = useDashboardStore((state) => state.setSales);
  const setEstimates = useDashboardStore((state) => state.setEstimates);
  const previousDate = useRef(date);
  const today = new Date();
  const dropdown: React.ComponentProps<typeof Calendar>["captionLayout"] = "dropdown";

  function InitialDate() {
    const startofDay = new Date();
    startofDay.setHours(0, 0, 0, 0);

    return {
      from: startofDay,
      to: undefined
    };
  }

  useEffect(() => {
    if (selected === "today") {
      const startofDay = new Date();
      startofDay.setHours(0, 0, 0, 0);
      setDate({ from: startofDay, to: startofDay });
    } else if (selected === "week") {
      const previous = today;
      previous.setDate(previous.getDate() - 7);
      const startOfWeek = new Date(previous);
      /**
       * getDay -> returns if Monday=0 , Tue=1
       * subtracting coz to get start of week
       * getDate -> returns 7,15,22
       */
      startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() - 1));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      setDate({ from: startOfWeek, to: endOfWeek });
    } else {
      const startofDay = new Date();
      startofDay.setHours(0, 0, 0, 0);
      setDate({ from: startofDay, to: startofDay });
    }
  }, [selected]);

  useEffect(() => {
    async function fetchSales() {
      if (!date) return;
      try {
        const response = await window.salesApi.getSalesDateRange(date as DateRangeType);
        if (response.status === "success") {
          setSales(response.data);
        } else {
          toast.error("Could not retrieve sales");
        }
      } catch (error) {
        console.log(error);
      }
    }

    async function fetchEstimates() {
      if (!date) return;
      try {
        const response = await window.estimatesApi.getEstimatesDateRange(date as DateRangeType);
        if (response.status === "success") {
          setEstimates(response.data);
        } else {
          toast.error("Could not retrieve estimates");
        }
      } catch (error) {
        console.log(error);
      }
    }
    if (
      !open &&
      (date?.from !== previousDate.current?.from || date?.from !== previousDate.current?.to)
    ) {
      if (pathname === "/sale") {
        fetchSales();
      } else {
        fetchEstimates();
      }

      previousDate.current = date;
    }
    if (pathname === "/sale") {
      fetchSales();
    } else {
      fetchEstimates();
    }
  }, [date, open]);

  const calendarClassNames = {
    month: "space-y-4",
    table: "w-full border-collapse space-y-1",
    weekdays: "flex",
    weekday: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] text-center",
    week: "flex w-full mt-2",
    day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
    day_button:
      "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[range-start=true]:bg-primary data-[range-end=true]:bg-primary",
    day_today: "bg-accent text-accent-foreground font-semibold",
    day_outside: "text-muted-foreground opacity-50",
    day_disabled: "text-muted-foreground opacity-50",
    day_hidden: "invisible"
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="my-2 flex w-full justify-between">
              <div />
              <button className="bg-primary/20 text-foreground flex h-10 items-center gap-2 rounded-lg px-4 text-lg font-medium">
                <CalendarIcon className="text-foreground" size={20} />
                {date?.from?.toLocaleDateString("en-IN", {
                  dateStyle: "medium"
                })}
                <MoveRight />
                {date?.from?.toLocaleDateString("en-IN", {
                  dateStyle: "medium"
                })}
                <ChevronDownIcon />
              </button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              disabled={{ after: new Date() }}
              selected={date}
              required={true}
              onSelect={setDate}
              captionLayout={dropdown}
              className="rounded-md shadow-sm"
              classNames={calendarClassNames}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};
