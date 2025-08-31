import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRangeType } from "@shared/types";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import toast from "react-hot-toast";

export const DatePicker = ({ selected }: { selected: string }) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined
  });

  const today = new Date();
  const [dropdown, setDropdown] =
    useState<React.ComponentProps<typeof Calendar>["captionLayout"]>("dropdown");
  // const [date, setDate] = React.useState<Date | undefined>(new Date(2025, 5, 12));

  useEffect(() => {
    console.log("date", date);
  }, [date]);

  useEffect(() => {
    if (selected === "today") {
      setDate({ from: today, to: today });
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
      setDate({ from: today });
    }
  }, [selected, setDate]);

  useEffect(() => {
    async function fetchSales() {
      if (!date) return;
      try {
        const response = await window.salesApi.getSalesDateRange(date as DateRangeType);
        if (response.status === "success") {
          console.log("all sales", response.data);
          // setSales(response.data);
        } else {
          console.log("error");
          toast.error("Could not retrieve sales");
        }
      } catch (error) {
        console.log(error);
      }
    }
    fetchSales();
  }, [date]);

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
                className="w-full min-w-lg justify-between py-8 text-lg font-semibold"
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
