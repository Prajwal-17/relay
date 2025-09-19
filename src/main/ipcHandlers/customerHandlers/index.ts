import { addCustomer } from "./addCustomer";
import { addImportedCustomers } from "./addImportedCustomers";
import { deleteCustomer } from "./deleteCustomer";
import { getAllCustomers } from "./getAllCustomers";
import { getAllTransactionsById } from "./getAllTransactionById";
import { getCustomerById } from "./getCustomerById";
import { getCustomerByName } from "./getCustomerByName";
import importContactsFromGoogle from "./importContactsFromGoogle";
import { searchCustomers } from "./searchCustomers";
import { updateCustomer } from "./updateCustomer";

export function customerHandlers() {
  addCustomer();
  addImportedCustomers();
  deleteCustomer();
  getAllCustomers();
  getAllTransactionsById();
  getCustomerById();
  getCustomerByName();
  searchCustomers();
  updateCustomer();
  importContactsFromGoogle();
}
