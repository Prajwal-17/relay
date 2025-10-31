import { ipcMain } from "electron";
import {
  TIME_PERIOD,
  type ApiResponse,
  type ChartDataType,
  type TimePeriodType
} from "../../../shared/types";
import { getSalesEstimatesRevenueByLast7Days } from "./utils/getSalesEstimatesRevenueByLast7Days";
import { getSalesEstimatesRevenueByMonth } from "./utils/getSalesEstimatesRevenueByMonth";
import { getSalesEstimatesRevenueByThisWeek } from "./utils/getSalesEstimatesRevenueByThisWeek";

export function getChartMetrics() {
  ipcMain.handle(
    "dashboardApi:getChartMetrics",
    async (_event, timePeriod: TimePeriodType): Promise<ApiResponse<ChartDataType[]>> => {
      try {
        let data: ChartDataType[];

        if (timePeriod === TIME_PERIOD.THIS_YEAR) {
          data = await getSalesEstimatesRevenueByMonth();
          return {
            status: "success",
            data: data
          };
        } else if (timePeriod === TIME_PERIOD.LAST_7_DAYS) {
          data = await getSalesEstimatesRevenueByLast7Days();
          return {
            status: "success",
            data: data
          };
        } else if (timePeriod === TIME_PERIOD.THIS_WEEK) {
          data = await getSalesEstimatesRevenueByThisWeek();
          return {
            status: "success",
            data: data
          };
        }

        return {
          status: "success",
          data: []
        };
      } catch (error) {
        console.log(error);
        return {
          status: "error",
          error: {
            message:
              (error as Error).message ?? "Something went wrong while fetching chart metrics."
          }
        };
      }
    }
  );
}
