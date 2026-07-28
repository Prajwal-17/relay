import type { LedgerEntry, LedgerSummary, PaginatedApiResponse } from "../../../shared/types";
import { LEDGER_ENTRY_TYPE } from "../../../shared/types";
import { db } from "../../db/db";
import { AppError } from "../../utils/appError";
import { ledgerRepository } from "./ledger.repository";
import type {
  CreateAdjustmentParams,
  CreateQuickSaleParams,
  DeleteLedgerEntryParams,
  GetLedgerParams,
  UpdateLedgerEntryParams
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

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

const ensureWithinTwoDays = (createdAt: string) => {
  if (Date.now() - new Date(createdAt).getTime() > TWO_DAYS_MS) {
    throw new AppError("This ledger entry is permanently locked after 48 hours", 409);
  }
};

const ensureNotSaleType = (type: string) => {
  if (type === LEDGER_ENTRY_TYPE.SALE) {
    throw new AppError("Sale entries cannot be edited or deleted", 400);
  }
};

const findAndGuardEntry = (
  tx: Parameters<typeof ledgerRepository.findLedgerEntryById>[0],
  entryId: string,
  customerId: string
) => {
  const entry = ledgerRepository.findLedgerEntryById(tx, entryId);
  if (!entry) throw new AppError(`Ledger entry ${entryId} not found`, 404);
  if (entry.customerId !== customerId)
    throw new AppError("Entry does not belong to this customer", 403);
  ensureWithinTwoDays(entry.createdAt);
  ensureNotSaleType(entry.type);
  return entry;
};

const updateLedgerEntry = async ({ entryId, customerId, payload }: UpdateLedgerEntryParams) => {
  assertCustomerExists(customerId);

  return db.transaction((tx) => {
    const entry = findAndGuardEntry(tx, entryId, customerId);

    if (entry.type !== LEDGER_ENTRY_TYPE.PAYMENT && payload.paymentMode !== undefined) {
      throw new AppError("Payment mode is only allowed on Payment entries", 400);
    }
    if (entry.type === LEDGER_ENTRY_TYPE.PAYMENT && payload.amountDue !== undefined) {
      throw new AppError("Payment entries cannot contain an amount due", 400);
    }
    if (
      entry.type !== LEDGER_ENTRY_TYPE.PAYMENT &&
      entry.type !== LEDGER_ENTRY_TYPE.ADJUSTMENT &&
      payload.amountPaid !== undefined
    ) {
      throw new AppError("This ledger entry cannot contain an amount paid", 400);
    }

    const updated = ledgerRepository.updateLedgerEntry(tx, entryId, payload);

    ledgerRepository.recomputeOutstanding(tx, customerId);
    return updated;
  });
};

const deleteLedgerEntry = async ({ entryId, customerId }: DeleteLedgerEntryParams) => {
  assertCustomerExists(customerId);

  return db.transaction((tx) => {
    findAndGuardEntry(tx, entryId, customerId);

    ledgerRepository.deleteLedgerEntryById(tx, entryId);

    ledgerRepository.recomputeOutstanding(tx, customerId);
  });
};

export const ledgerService = {
  getLedgerByCustomerId,
  getLedgerSummary,
  createPayment,
  createAdjustment,
  createQuickSale,
  updateLedgerEntry,
  deleteLedgerEntry
};
