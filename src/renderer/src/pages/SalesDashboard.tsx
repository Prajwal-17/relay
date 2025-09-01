import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardTable } from "@/features/transactionDashboard/DashboardTable";
import { DatePicker } from "@/features/transactionDashboard/DatePicker";
import { Plus } from "lucide-react";
import { useState } from "react";

const SalesDashboard = () => {
  const [selected, setSelected] = useState("");

  return (
    <>
      <div className="bg-muted/70 h-full flex-1 space-y-6 overflow-y-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Sales</h1>
            <p className="text-muted-foreground text-lg">View Sales</p>
          </div>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 h-12 gap-2 px-6 py-3 text-lg font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Create Estimate
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-foreground text-xl font-medium">Filter by</span>
                <span className="rounded-md bg-black/10 px-2.5 py-1 text-lg font-medium text-black">
                  Date Range
                </span>
              </div>

              <div className="flex items-center gap-2" aria-label="Quick presets">
                <Button
                  variant={selected === "today" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelected("today")}
                  className="text-lg"
                >
                  Today
                </Button>
                <Button
                  variant={selected === "week" ? "default" : "outline"}
                  size="lg"
                  onClick={() => setSelected("week")}
                  className="text-lg"
                >
                  This week
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  className="text-lg"
                  onClick={() => setSelected("")}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex w-full items-stretch justify-between">
              <Card className="py-6 pr-16 pl-4">
                <div className="space-y-2">
                  <div className="text-muted-foreground text-lg font-medium">Total Estimate</div>
                  <div className="text-4xl font-bold">₹ 17.00</div>
                  <div className="text-muted-foreground text-lg">17 transactions</div>
                </div>
              </Card>
              <DatePicker selected={selected} />
            </div>
          </CardContent>
        </Card>

        <DashboardTable />
      </div>
    </>
  );
};

export default SalesDashboard;
