import { useBillingStore } from "@/store/billingStore";
import { useLineItemsStore } from "@/store/lineItemsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";

const useTransactionState = () => {
  // billing store
  const billingId = useBillingStore((state) => state.billingId);
  const setBillingId = useBillingStore((state) => state.setBillingId);
  const billingType = useBillingStore((state) => state.billingType);
  const setBillingType = useBillingStore((state) => state.setBillingType);
  const transactionNo = useBillingStore((state) => state.transactionNo);
  const setTransactionNo = useBillingStore((state) => state.setTransactionNo);
  const billingDate = useBillingStore((state) => state.billingDate);
  const setBillingDate = useBillingStore((state) => state.setBillingDate);
  const customerId = useBillingStore((state) => state.customerId);
  const setCustomerId = useBillingStore((state) => state.setCustomerId);
  const customerName = useBillingStore((state) => state.customerName);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);
  const customerContact = useBillingStore((state) => state.customerContact);
  const setCustomerContact = useBillingStore((state) => state.setCustomerContact);
  const isNewCustomer = useBillingStore((state) => state.isNewCustomer);
  const setIsNewCustomer = useBillingStore((state) => state.setIsNewCustomer);
  // lineItems store
  const lineItems = useLineItemsStore((state) => state.lineItems);
  const setLineItems = useLineItemsStore((state) => state.setLineItems);
  const addEmptyLineItem = useLineItemsStore((state) => state.addEmptyLineItem);
  const updateLineItem = useLineItemsStore((state) => state.updateLineItem);
  const deleteLineItem = useLineItemsStore((state) => state.deleteLineItem);
  const setAllChecked = useLineItemsStore((state) => state.setAllChecked);
  // search drop down store
  const setSearchParam = useSearchDropdownStore((state) => state.setSearchParam);
  const setSearchRow = useSearchDropdownStore((state) => state.setSearchRow);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);

  return {
    billingId,
    setBillingId,
    billingType,
    setBillingType,
    transactionNo,
    setTransactionNo,
    billingDate,
    setBillingDate,
    customerId,
    setCustomerId,
    customerName,
    setCustomerName,
    customerContact,
    setCustomerContact,
    isNewCustomer,
    setIsNewCustomer,
    lineItems,
    setLineItems,
    addEmptyLineItem,
    updateLineItem,
    deleteLineItem,
    setAllChecked,
    setSearchParam,
    setSearchRow,
    setIsDropdownOpen
  };
};

export default useTransactionState;
