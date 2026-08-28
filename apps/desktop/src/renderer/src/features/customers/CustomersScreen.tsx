import { ErrorState } from "@/components/app-ui/ErrorState";
import { useCustomer } from "@/features/customers/hooks/useCustomer";
import { ApiError } from "@/lib/apiClient";
import { LoaderCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CustomerActionsProvider } from "./CustomerActionsContext";
import { type CustomerActions } from "./customerActions";
import { CustomerDetailView } from "./detail/CustomerDetailView";
import { AdjustBalanceDialog } from "./dialogs/AdjustBalanceDialog";
import { CustomerFormDialog } from "./dialogs/CustomerFormDialog";
import { CustomerSearchModal } from "./dialogs/CustomerSearchModal";
import { PaymentDialog } from "./dialogs/PaymentDialog";
import { QuickSaleDialog } from "./dialogs/QuickSaleDialog";
import { CustomerListView } from "./list/CustomerListView";

//  /customers             → list
//  /customers/:customerId → detail
export function CustomersScreen() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const isDetail = customerId !== undefined;

  const { customer, isLoading, isError, error, refetch, isFetching } = useCustomer(
    isDetail ? customerId : undefined
  );
  const selected = customer ?? null;
  const isCustomerNotFound =
    error instanceof ApiError && (error.status === 400 || error.status === 404);

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
          ) : isError && !selected ? (
            <ErrorState
              layout="page"
              title={isCustomerNotFound ? "Customer not found" : "Couldn't load customer"}
              description={isCustomerNotFound ? "This customer does not exist." : "Try again."}
              primaryAction={
                isCustomerNotFound
                  ? undefined
                  : { label: "Try again", onClick: () => void refetch(), loading: isFetching }
              }
              secondaryAction={{
                label: "Back to customers",
                onClick: () => navigate("/customers", { replace: true })
              }}
            />
          ) : (
            <CustomerDetailView
              key={customerId ?? "none"}
              customerId={customerId!}
              customer={selected}
            />
          )
        ) : (
          <CustomerListView />
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
