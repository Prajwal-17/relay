import { convertEstimateToSale } from "./convertEstimateToSale";
import { deleteEstimate } from "./deleteEstimate";
import { filterByDate } from "./filterByDate";
import { getAllEstimates } from "./getAllEstimates";
import { getEstimateById } from "./getEstimateById";
import { getNextEstimateNo } from "./getNextEstimateNo";
import { saveEstimate } from "./saveEstimate";

export function estimateHandlers() {
  getNextEstimateNo();
  getAllEstimates();
  getEstimateById();
  saveEstimate();
  filterByDate();
  deleteEstimate();
  convertEstimateToSale();
}
