import { useCustomerStore } from "@/store/customersStore";
import { Users } from "lucide-react";
import { CustomerDetails } from "./CustomerDetails";
import { CustomerSidebar } from "./CustomerSidebar";
import { CustomerTransactions } from "./CustomerTransactions";

export const CustomerLayout = () => {
  const selectedCustomer = useCustomerStore((state) => state.selectedCustomer);

  return (
    <>
      <div className="flex flex-1">
        <CustomerSidebar />
        <div className="flex-1 p-6">
          {selectedCustomer ? (
            <>
              <CustomerDetails />
              <CustomerTransactions />
            </>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <div className="text-center">
                <Users className="mx-auto mb-6 h-16 w-16" />
                <p className="text-lg">Select a customer to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
