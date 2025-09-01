import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDashboardStore } from "@/store/salesStore";
import type { DateRangeType } from "@shared/types";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
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
  const [dropdown, setDropdown] =
    useState<React.ComponentProps<typeof Calendar>["captionLayout"]>("dropdown");

  function InitialDate() {
    const startofDay = new Date();
    startofDay.setHours(0, 0, 0, 0);
    console.log("start", startofDay);

    return {
      from: startofDay,
      to: undefined
    };
  }

  useEffect(() => {
    if (selected === "today") {
      const startofDay = new Date();
      startofDay.setHours(0, 0, 0, 0);
      setDate({ from: startofDay });
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
      setDate({ from: startofDay });
    }
  }, [selected]);

  useEffect(() => {
    async function fetchSales() {
      if (!date) return;
      try {
        console.log("before request", date);
        const response = await window.salesApi.getSalesDateRange(date as DateRangeType);
        if (response.status === "success") {
          console.log("all sales in date picker", response.data);
          setSales(response.data);
        } else {
          console.log("error");
          toast.error("Could not retrieve sales");
        }
      } catch (error) {
        console.log(error);
      }
    }

    async function fetchEstimates() {
      if (!date) return;
      try {
        console.log("before request", date);
        const response = await window.estimatesApi.getEstimatesDateRange(date as DateRangeType);
        if (response.status === "success") {
          console.log("all estimates in date picker", response.data);
          setEstimates(response.data);
        } else {
          console.log("error");
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

  const formatDate = () => {
    if (
      date?.from?.toLocaleString("en-IN", { dateStyle: "medium" }) ===
      date?.to?.toLocaleString("en-IN", { dateStyle: "medium" })
    ) {
      return date?.from?.toLocaleString("en-IN", {
        dateStyle: "medium"
      });
    }

    if (date?.to === undefined) {
      return date?.from?.toLocaleString("en-IN", {
        dateStyle: "medium"
      });
    }

    if (date.from && date.to) {
      return `${date.from.toLocaleString("en-IN", {
        dateStyle: "medium"
      })} to ${date.to.toLocaleString("en-IN", {
        dateStyle: "medium"
      })}`;
    }

    return;
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-background flex max-w-2xl min-w-0 flex-1 items-center gap-2 rounded-md border px-3 py-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full min-w-lg justify-between py-8 text-lg font-semibold hover:cursor-pointer hover:bg-neutral-200"
              >
                <CalendarIcon className="text-foreground" size={40} />
                {formatDate()}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                disabled={{ after: new Date() }}
                selected={date}
                required={true}
                onSelect={setDate}
                captionLayout={dropdown}
                className="rounded-lg border shadow-sm"
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </>
  );
};
