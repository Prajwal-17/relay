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
          <div className="text-muted-foreground text-sm font-medium">Sort by:</div>
          <Select
            value={sortBy}
            defaultValue={sortBy}
            onValueChange={(value: SortType) => setSortBy(value)}
          >
            <SelectTrigger className="text-foreground h-9 w-52 cursor-pointer text-sm font-medium">
              <SelectValue placeholder="Date (Newest First)" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <SelectItem
                    key={idx}
                    value={s.value}
                    className="cursor-pointer text-sm font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="text-muted-foreground size-4" />
                      {s.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <DateRangePicker />
        </div>
      </div>
      <DashboardTable />
    </>
  );
};
