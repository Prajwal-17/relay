import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import type { SortType } from "@shared/types";
import { LoaderCircle, Search } from "lucide-react";
import { DateRangePicker } from "./DateRangePicker";

export const DashboardTable = () => {
  const { pathname, sales, estimates, sortBy, setSortBy } = useDashboard();
  const { parentRef, rowVirtualizer, hasNextPage, status, transactionData } = useInfiniteScroll();

  return (
    <>
      <Card className="my-0 py-4">
        <CardContent>
          <div className="flex items-center justify-between gap-3 pt-2 pb-5">
            <div className="relative w-full max-w-lg">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search sales by customer, amount or invoice No"
                className="bg-background border-border/50 focus:border-primary/50 py-5 pl-10 !text-lg font-medium"
              />
            </div>
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
          <div className="pb-2 pl-1 text-blue-600">
            {pathname === "/sale"
              ? `Showing ${sales.length || 0} results`
              : `Showing ${estimates.length || 0} results`}
          </div>

          {status === "pending" ? (
            <div className="mt-8 flex justify-center gap-3">
              <div className="text-muted-foreground text-xl font-semibold">Loading</div>
              <LoaderCircle className="animate-spin text-blue-500" size={26} />
            </div>
          ) : (
            <div
              ref={parentRef}
              style={{
                height: `500px`,
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
                  const transaction = transactionData[virtualRow.index];

                  return (
                    <div
                      key={virtualRow.index}
                      // className={virtualRow.index % 2 ? "ListItemOdd" : "ListItemEven"}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`
                      }}
                    >
                      {isLoaderRow ? (
                        hasNextPage ? (
                          "Loading more..."
                        ) : (
                          "Nothing more to load"
                        )
                      ) : (
                        <div>{transaction.id}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
