import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { sortOptions } from "@/constants";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import type { SortType } from "@shared/types";
import { DashboardTable } from "./DashboardTable";
import { DateRangePicker } from "./DateRangePicker";

export const DashboardCard = () => {
  const { sortBy, setSortBy } = useDashboard();

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-full w-full items-center justify-end gap-3">
          <div className="text-muted-foreground text-base font-medium">Sort by: </div>
          <Select
            value={sortBy}
            defaultValue={sortBy}
            onValueChange={(value: SortType) => setSortBy(value)}
          >
            <SelectTrigger className="text-foreground h-11! w-55 cursor-pointer text-base font-semibold">
              <SelectValue placeholder="Date (Newest First)" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((s, idx) => (
                <SelectItem key={idx} value={s.value} className="cursor-pointer">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker />
        </div>
      </div>
      <DashboardTable />
    </>
  );
};
