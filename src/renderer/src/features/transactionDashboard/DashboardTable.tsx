import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { sortOptions } from "@/constants";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { useInfiniteScroll } from "@/hooks/dashboard/useInfiniteScroll";
import type { SaleSummaryType, SortType } from "@shared/types";
import { LoaderCircle } from "lucide-react";
import { DashboardTableRow } from "./DashboardTableRow";
import { DateRangePicker } from "./DateRangePicker";

export const DashboardTable = () => {
  const { pathname, sales, estimates, sortBy, setSortBy } = useDashboard();
  const { parentRef, rowVirtualizer, status, transactionData } = useInfiniteScroll();

  return (
    <Card className="py-4">
      <CardContent>
        <div className="flex items-center justify-between gap-3 pt-2">
          {/* <div className="relative w-full max-w-lg">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search sales by customer, amount or invoice No"
              className="bg-background border-border/50 focus:border-primary/50 py-5 pl-10 !text-lg font-medium"
            />
          </div> */}
          <div className="flex h-full w-full items-center justify-end gap-3">
            <div className="text-muted-foreground text-md font-medium">Sort by: </div>
            <Select
              value={sortBy}
              defaultValue={sortBy}
              onValueChange={(value: SortType) => setSortBy(value)}
            >
              <SelectTrigger className="text-foreground !h-11 w-[220px] text-base font-semibold">
                <SelectValue placeholder="Date (Newest First)" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((s, idx) => (
                  <SelectItem key={idx} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker />
          </div>
        </div>

        <div className="text-muted-foreground pb-2 text-sm">
          Showing{" "}
          <span className="text-foreground font-semibold">
            {pathname === "/sale" ? sales.length || 0 : estimates.length || 0}
          </span>{" "}
          results
        </div>

        {status === "pending" ? (
          <div className="my-8 flex justify-center gap-3">
            <div className="text-muted-foreground text-lg font-semibold">Loading</div>
            <LoaderCircle className="text-primary animate-spin" size={24} />
          </div>
        ) : (
          <div className="border-border rounded-lg border">
            <div className="bg-muted/70 text-muted-foreground grid grid-cols-12 gap-4 px-6 py-4 text-base font-semibold">
              <div className="col-span-2 flex items-center">Date</div>
              <div className="col-span-3 flex items-center">Customer Name</div>
              <div className="col-span-2 flex items-center">Invoice No</div>
              <div className="col-span-2 flex items-center">Amount</div>
              <div className="col-span-2 flex items-center">Status</div>
              <div className="col-span-1 flex items-center justify-start">Actions</div>
            </div>

            <div
              ref={parentRef}
              style={{
                height: `475px`,
                width: `100%`,
                overflow: "auto"
              }}
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative"
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const isLoaderRow = virtualRow.index > transactionData.length - 1;
                  const transaction: SaleSummaryType = transactionData[virtualRow.index];

                  return (
                    <DashboardTableRow
                      key={virtualRow.index}
                      virtualRow={virtualRow}
                      transaction={transaction}
                      isLoaderRow={isLoaderRow}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
