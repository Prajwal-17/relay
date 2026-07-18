import type { LedgerEntry, LedgerSummary, PaginatedApiResponse } from "../../../shared/types";
import { db } from "../../db/db";
import { AppError } from "../../utils/appError";
import { ledgerRepository } from "./ledger.repository";
import type {
  CreateAdjustmentParams,
  CreateOpeningBalanceParams,
  CreateQuickSaleParams,
  GetLedgerParams
} from "./ledger.types";

const assertCustomerExists = (customerId: string) => {
  const customer = ledgerRepository.findCustomerById(db, customerId);
  if (!customer) {
    throw new AppError(`Customer with ID ${customerId} not found`, 404);
  }
};

const getLedgerByCustomerId = async (
  params: GetLedgerParams
): Promise<PaginatedApiResponse<{ data: LedgerEntry[] }>> => {
  const rows = ledgerRepository.getLedgerByCustomerId(params);
  const totalCount = ledgerRepository.countLedgerByCustomerId(params);

  const nextPageNo = rows.length === params.pageSize ? params.pageNo + 1 : null;

  return {
    nextPageNo,
    totalCount,
    data: rows
  };
};

const getLedgerSummary = async (customerId: string): Promise<LedgerSummary> => {
  assertCustomerExists(customerId);
  return ledgerRepository.getLedgerSummary(customerId);
};

const createPayment = ledgerRepository.createPayment;

const createAdjustment = async ({ customerId, payload }: CreateAdjustmentParams) => {
  assertCustomerExists(customerId);

  return db.transaction((tx) => {
    const entry = ledgerRepository.insertAdjustment(tx, customerId, payload);
    ledgerRepository.recomputeOutstanding(tx, customerId);
    return entry;
  });
};

const createQuickSale = async ({ customerId, payload }: CreateQuickSaleParams) => {
  assertCustomerExists(customerId);

  return db.transaction((tx) => {
    const entry = ledgerRepository.insertQuickSale(tx, customerId, payload);
    ledgerRepository.recomputeOutstanding(tx, customerId);
    return entry;
  });
};

const createOpeningBalance = async ({ customerId, payload }: CreateOpeningBalanceParams) => {
  assertCustomerExists(customerId);

  return db.transaction((tx) => {
    if (ledgerRepository.hasOpeningBalance(tx, customerId)) {
      throw new AppError("Opening balance already exists for this customer", 400);
    }
    const entry = ledgerRepository.insertOpeningBalance(tx, customerId, payload);
    ledgerRepository.recomputeOutstanding(tx, customerId);
    return entry;
  });
};

export const ledgerService = {
  getLedgerByCustomerId,
  getLedgerSummary,
  createPayment,
  createAdjustment,
  createQuickSale,
  createOpeningBalance
};
