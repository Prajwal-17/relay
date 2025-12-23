import type {
  ApiResponse,
  CreateCustomerPayload,
  Customer,
  UpdateProductPayload
} from "../../../shared/types";
import { customersRepository } from "./customers.repository";

const findById = async (id: string): Promise<ApiResponse<Customer>> => {
  try {
    const customer = await customersRepository.findById(id);

    if (!customer) {
      return {
        status: "error",
        error: {
          message: `Customer with ID ${id} not found`
        }
      };
    }

    return {
      status: "success",
      data: customer
    };
  } catch (error) {
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while fetching customer"
      }
    };
  }
};

const getCustomers = async (searchTerm: string): Promise<ApiResponse<Customer[]>> => {
  try {
    const customerResult = await customersRepository.getCustomers(searchTerm);

    return {
      status: "success",
      data: customerResult
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while fetching customers"
      }
    };
  }
};

const createCustomer = async (payload: CreateCustomerPayload): Promise<ApiResponse<Customer>> => {
  try {
    const customer = await customersRepository.createCustomers(payload);

    return {
      status: "success",
      data: customer,
      message: `Successfull created customer: ${customer.name}`
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while creating customer"
      }
    };
  }
};

const updateCustomerById = async (
  customerId: string,
  payload: Partial<UpdateProductPayload>
): Promise<ApiResponse<Customer>> => {
  try {
    const existingCustomer = await customersRepository.findById(customerId);

    if (!existingCustomer) {
      return {
        status: "error",
        error: {
          message: "Customer does not exist"
        }
      };
    }

    const updatedCustomer = await customersRepository.updateById(customerId, payload);
    if (!updatedCustomer) throw new Error("Failed to update customer");

    return {
      status: "success",
      data: updatedCustomer,
      message: `Successfully updated customer:${updatedCustomer.name}`
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while updating customer"
      }
    };
  }
};

const deleteCustomerById = async (id: string): Promise<ApiResponse<string>> => {
  try {
    const hasExistingTransactions = await customersRepository.hasExistingTransactions(id);

    if (hasExistingTransactions > 0) {
      return {
        status: "error",
        error: {
          message: "Cannot delete customer with existing sales or estimates."
        }
      };
    }

    const deletedCustomer = await customersRepository.deleteById(id);

    if (deletedCustomer.changes <= 0) {
      throw new Error("Could not delete Customer");
    }

    return {
      status: "success",
      data: "Successfully deleted customer"
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: {
        message: (error as Error).message ?? "Something went wrong while deleting customer"
      }
    };
  }
};

export const customersService = {
  findById,
  getCustomers,
  createCustomer,
  updateCustomerById,
  deleteCustomerById
};
