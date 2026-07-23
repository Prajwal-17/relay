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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex min-h-10 shrink-0 items-center justify-end gap-2 rounded-(--radius-panel) px-3 py-1">
        <span className="text-muted-foreground text-xs font-medium">Sort by</span>
        <Select
          value={sortBy}
          defaultValue={sortBy}
          onValueChange={(value: SortType) => setSortBy(value)}
        >
          <SelectTrigger className="text-foreground h-8 w-48 cursor-pointer text-sm font-medium">
            <SelectValue placeholder="Date (Newest First)" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Icon className="text-muted-foreground size-4" />
                    {option.label}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <DateRangePicker />
      </div>
      <DashboardTable />
    </div>
  );
};
