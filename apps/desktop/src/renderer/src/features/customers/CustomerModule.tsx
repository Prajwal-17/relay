import { useCustomer } from "@/hooks/customers/useCustomer";
import { LoaderCircle } from "lucide-react";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { CustomerDetailPage } from "./detail/CustomerDetailPage";
import { toCustomerDetail } from "./detail/types";
import { CustomerFormDialog } from "./dialogs/CustomerFormDialog";
import { CustomerSearchModal } from "./dialogs/CustomerSearchModal";
import { PaymentDialog } from "./dialogs/PaymentDialog";
import { CustomerListPage } from "./list/CustomerListPage";

//  /customers             → list
//  /customers/:customerId → detail
export function CustomerModule() {
  const { customerId } = useParams<{ customerId: string }>();
  const isDetail = customerId !== undefined;

  const { customer, isLoading } = useCustomer(isDetail ? customerId : undefined);
  // chore: to be removed - toCustomerDetail -> jst a mock func
  const selected = customer ? toCustomerDetail(customer) : null;

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
        isLoading && !selected ? (
          <div className="flex h-full w-full items-center justify-center">
            <LoaderCircle className="text-muted-foreground size-7 animate-spin" />
          </div>
        ) : (
          <CustomerDetailPage
            key={customerId ?? "none"}
            customerId={customerId!}
            customer={selected}
            onEdit={openEditForm}
            onRecordPayment={() => setPaymentOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
          />
        )
      ) : (
        <CustomerListPage onNewCustomer={openAddForm} />
      )}

      {formOpen && (
        <CustomerFormDialog
          mode={formMode}
          customer={formMode === "edit" ? (customer ?? null) : null}
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
