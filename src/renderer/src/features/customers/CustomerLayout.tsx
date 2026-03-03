import useCustomers from "@/hooks/customers/useCustomers";
import { Users } from "lucide-react";
import { CustomerDetails } from "./CustomerDetails";
import { CustomerSidebar } from "./CustomerSidebar";
import { CustomerTable } from "./CustomerTable";

export const CustomerLayout = () => {
  const { selectedCustomer } = useCustomers();

  return (
    <>
      <div className="bg-background flex flex-1">
        <CustomerSidebar />
        <div className="bg-background flex flex-1 flex-col overflow-hidden p-4">
          {selectedCustomer ? (
            <div className="flex h-full flex-col overflow-hidden">
              <CustomerDetails />
              <div className="flex min-h-0 flex-1">
                <CustomerTable customerId={selectedCustomer.id} />
              </div>
            </div>
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
