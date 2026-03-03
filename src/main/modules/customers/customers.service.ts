import {
  TRANSACTION_TYPE,
  type CreateCustomerPayload,
  type Customer,
  type CustomerSummary,
  type CustomerTransaction,
  type Estimate,
  type PaginatedApiResponse,
  type UpdateProductPayload
} from "../../../shared/types";
import { AppError } from "../../utils/appError";
import { customersRepository } from "./customers.repository";
import type { EstimatesByCustomerParams, SalesByCustomerParams } from "./customers.types";

const findById = async (id: string): Promise<Customer> => {
  const customer = await customersRepository.findById(id);

  if (!customer) {
    throw new AppError(`Customer with ID ${id} not found`, 404);
  }

  return customer;
};

const getCustomers = async (searchTerm: string): Promise<Customer[]> => {
  const customerResult = await customersRepository.getCustomers(searchTerm);
  return customerResult;
};

const getDefaultCustomer = async (): Promise<Customer> => {
  const customerResult = await customersRepository.getDefaultCustomer();

  if (!customerResult) {
    throw new AppError("Could not find DEFAULT customer", 404);
  }

  return customerResult;
};

const getSalesByCustomerId = async (
  params: SalesByCustomerParams
): Promise<PaginatedApiResponse<{ data: CustomerTransaction[] | [] }>> => {
  const sales = await customersRepository.getSalesByCustomerId(params);

  const nextPageNo = sales.length === 20 ? params.pageNo + 1 : null;

  return {
    nextPageNo: nextPageNo,
    data:
      sales.length > 0
        ? sales.map((s) => ({
            type: TRANSACTION_TYPE.SALE,
            transactionNo: s.invoiceNo,
            ...s
          }))
        : []
  };
};

const getEstimatesByCustomerId = async (
  params: EstimatesByCustomerParams
): Promise<PaginatedApiResponse<{ data: Estimate[] | [] }>> => {
  const estimates = await customersRepository.getEstimatesByCustomerId(params);

  const nextPageNo = estimates.length === 20 ? params.pageNo + 1 : null;

  return {
    nextPageNo: nextPageNo,
    data:
      estimates.length > 0
        ? estimates.map((e) => ({
            type: TRANSACTION_TYPE.ESTIMATE,
            transactionNo: e.estimateNo,
            ...e
          }))
        : []
  };
};

const getCustomerSummary = async (id: string): Promise<CustomerSummary> => {
  const result = await customersRepository.getCustomerSummary(id);
  return result;
};

const createCustomer = async (payload: CreateCustomerPayload): Promise<Customer> => {
  const customer = await customersRepository.createCustomer(payload);

  if (!customer) {
    throw new AppError("Failed to create customer", 500);
  }

  return customer;
};

const updateCustomerById = async (
  customerId: string,
  payload: Partial<UpdateProductPayload>
): Promise<Customer> => {
  const existingCustomer = await customersRepository.findById(customerId);

  if (!existingCustomer) {
    throw new AppError("Customer does not exist", 404);
  }

  const updatedCustomer = await customersRepository.updateById(customerId, payload);
  if (!updatedCustomer) {
    throw new AppError("Failed to update customer", 400);
  }

  return updatedCustomer;
};

const deleteCustomerById = async (id: string): Promise<void> => {
  const changes = await customersRepository.deleteById(id);

  if (changes <= 0) {
    throw new AppError("Could not delete Customer", 400);
  }
};

export const customersService = {
  findById,
  getCustomers,
  getDefaultCustomer,
  getSalesByCustomerId,
  getEstimatesByCustomerId,
  getCustomerSummary,
  createCustomer,
  updateCustomerById,
  deleteCustomerById
};
