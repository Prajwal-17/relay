import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { getCustomerById } from "./_mock/data";
import { CustomerDetailPage } from "./detail/CustomerDetailPage";
import { CustomerFormDialog } from "./dialogs/CustomerFormDialog";
import { CustomerSearchModal } from "./dialogs/CustomerSearchModal";
import { PaymentDialog } from "./dialogs/PaymentDialog";
import { CustomerListPage } from "./list/CustomerListPage";

//  /customers             → list
//  /customers/:customerId → detail
export function CustomerModule() {
  const { customerId } = useParams<{ customerId: string }>();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isDetail = customerId !== undefined;
  const selected = customerId ? (getCustomerById(customerId) ?? null) : null;

  const openAddForm = useCallback(() => {
    setFormMode("add");
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback(() => {
    setFormMode("edit");
    setFormOpen(true);
  }, []);

  return (
    <div className="bg-background flex h-full min-h-full">
      {isDetail ? (
        <CustomerDetailPage
          key={customerId ?? "none"}
          customer={selected}
          onEdit={openEditForm}
          onRecordPayment={() => setPaymentOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
      ) : (
        <CustomerListPage onNewCustomer={openAddForm} />
      )}

      {formOpen && (
        <CustomerFormDialog
          mode={formMode}
          customer={formMode === "edit" ? selected : null}
          onClose={() => setFormOpen(false)}
        />
      )}

      {paymentOpen && selected && (
        <PaymentDialog customer={selected} onClose={() => setPaymentOpen(false)} />
      )}

      {searchOpen && <CustomerSearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
