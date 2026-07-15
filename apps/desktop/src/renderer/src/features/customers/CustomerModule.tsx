import { useCustomer } from "@/hooks/customers/useCustomer";
import { LoaderCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CustomerActionsProvider } from "./CustomerActionsContext";
import { type CustomerActions } from "./customerActions";
import { CustomerDetailPage } from "./detail/CustomerDetailPage";
import { toCustomerDetail } from "./detail/types";
import { AdjustBalanceDialog } from "./dialogs/AdjustBalanceDialog";
import { CustomerFormDialog } from "./dialogs/CustomerFormDialog";
import { CustomerSearchModal } from "./dialogs/CustomerSearchModal";
import { PaymentDialog } from "./dialogs/PaymentDialog";
import { QuickSaleDialog } from "./dialogs/QuickSaleDialog";
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
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [quickSaleOpen, setQuickSaleOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const openAddForm = useCallback(() => {
    setFormMode("add");
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback(() => {
    setFormMode("edit");
    setFormOpen(true);
  }, []);

  const openPayment = useCallback(() => setPaymentOpen(true), []);
  const openAdjust = useCallback(() => setAdjustOpen(true), []);
  const openQuickSale = useCallback(() => setQuickSaleOpen(true), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  const actions = useMemo<CustomerActions>(
    () => ({
      openAddForm,
      openEditForm,
      openPayment,
      openAdjust,
      openQuickSale,
      openSearch
    }),
    [openAddForm, openEditForm, openPayment, openAdjust, openQuickSale, openSearch]
  );

  return (
    <CustomerActionsProvider value={actions}>
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
            />
          )
        ) : (
          <CustomerListPage />
        )}

        {formOpen && (
          <CustomerFormDialog
            mode={formMode}
            customer={formMode === "edit" ? (customer ?? null) : null}
            onClose={() => setFormOpen(false)}
          />
        )}

        {paymentOpen && customerId && (
          <PaymentDialog
            customerId={customerId}
            customerName={customer?.name ?? ""}
            outstanding={customer?.outstandingBalance ?? 0}
            onClose={() => setPaymentOpen(false)}
          />
        )}

        {adjustOpen && customerId && (
          <AdjustBalanceDialog customerId={customerId} onClose={() => setAdjustOpen(false)} />
        )}

        {quickSaleOpen && customerId && (
          <QuickSaleDialog customerId={customerId} onClose={() => setQuickSaleOpen(false)} />
        )}

        {searchOpen && <CustomerSearchModal onClose={() => setSearchOpen(false)} />}
      </div>
    </CustomerActionsProvider>
  );
}
