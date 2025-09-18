import { convertSaletoEstimate } from "./convertSaleToEstimate";
import { deleteSale } from "./deleteSale";
import { filterByDate } from "./filterByDate";
import { getAllSales } from "./getAllSales";
import { getNextInvoiceNo } from "./getNextInvoiceNo";
import { getSaleById } from "./getSaleById";
import { saveSale } from "./saveSale";

export function saleHandlers() {
  getNextInvoiceNo();
  getAllSales();
  getSaleById();
  saveSale();
  filterByDate();
  deleteSale();
  convertSaletoEstimate();
}
