import { useCallback, useState } from "react";
import { CustomerListPage } from "./list/CustomerListPage";
import { CustomerDetailPage } from "./detail/CustomerDetailPage";
import { CustomerFormDialog } from "./dialogs/CustomerFormDialog";
import { PaymentDialog } from "./dialogs/PaymentDialog";
import { CustomerSearchModal } from "./dialogs/CustomerSearchModal";
import { getCustomerById } from "./_mock/data";

type View = "list" | "detail";

/**
 * View-swap root for the Customer Module V3.
 *
 * Replaces the old master-detail `CustomerLayout`. Selection drives a local
 * `view` + `selectedCustomerId` pair — no router changes (plan §0/§1).
 * Overlay open-state lives here so header, list, and detail can all trigger
 * the same dialogs (form / payment / search).
 */
export function CustomerModuleV3() {
  const [view, setView] = useState<View>("list");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const selected = selectedCustomerId ? (getCustomerById(selectedCustomerId) ?? null) : null;

  const handleSelect = useCallback((id: string) => {
    setSelectedCustomerId(id);
    setView("detail");
  }, []);

  const handleBack = useCallback(() => {
    setView("list");
  }, []);

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
      {view === "list" ? (
        <CustomerListPage onSelect={handleSelect} onNewCustomer={openAddForm} />
      ) : (
        <CustomerDetailPage
          customer={selected}
          onBack={handleBack}
          onEdit={openEditForm}
          onRecordPayment={() => setPaymentOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />
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

      {searchOpen && (
        <CustomerSearchModal
          onSelect={(id) => {
            handleSelect(id);
            setSearchOpen(false);
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  );
}
