import { useBillingStore } from "@/store/billingStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";

const useTransactionState = () => {
  const billingId = useBillingStore((state) => state.billingId);
  const setBillingId = useBillingStore((state) => state.setBillingId);
  const invoiceNo = useBillingStore((state) => state.invoiceNo);
  const setInvoiceNo = useBillingStore((state) => state.setInvoiceNo);
  const customerName = useBillingStore((state) => state.customerName);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);
  const customerContact = useBillingStore((state) => state.customerContact);
  const setCustomerContact = useBillingStore((state) => state.setCustomerContact);
  const lineItems = useBillingStore((state) => state.lineItems);
  const setLineItems = useBillingStore((state) => state.setLineItems);
  const addEmptyLineItem = useBillingStore((state) => state.addEmptyLineItem);
  const updateLineItems = useBillingStore((state) => state.updateLineItems);
  const deleteLineItem = useBillingStore((state) => state.deleteLineItem);
  const setSearchParam = useSearchDropdownStore((state) => state.setSearchParam);
  const setSearchRow = useSearchDropdownStore((state) => state.setSearchRow);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);

  return {
    billingId,
    setBillingId,
    invoiceNo,
    setInvoiceNo,
    customerName,
    setCustomerName,
    customerContact,
    setCustomerContact,
    lineItems,
    setLineItems,
    addEmptyLineItem,
    updateLineItems,
    deleteLineItem,
    setSearchRow,
    setSearchParam,
    setIsDropdownOpen
  };
};

export default useTransactionState;
