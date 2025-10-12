import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useCustomers from "@/hooks/useCustomers";
import { Download, LoaderCircle, Plus, Search } from "lucide-react";
import { CustomerDialog } from "./CustomerDialog";
import { getCustomerTypeColor } from "./CustomerTypeColor";

export const CustomerSidebar = () => {
  const {
    selectedCustomer,
    setSelectedCustomer,
    openCustomerDialog,
    setOpenCustomerDialog,
    setActionType,
    setFormData,
    customerSearch,
    setCustomerSearch,
    customers,
    customerStatus
  } = useCustomers();

  return (
    <>
      <div className="border-border bg-background flex h-full w-96 flex-col border-r">
        <div className="border-border border-b p-4">
          <h2 className="mb-4 text-2xl font-semibold">Customers</h2>

          <div className="mb-4 flex gap-2">
            <Dialog
              open={openCustomerDialog}
              onOpenChange={() => {
                setFormData({});
                setActionType("add");
                setOpenCustomerDialog();
              }}
            >
              <DialogTrigger asChild>
                <Button className="hover:bg-primary/80 h-12 flex-1 text-base font-semibold hover:cursor-pointer">
                  <Plus className="mr-1 h-5 w-5" />
                  Add Customer
                </Button>
              </DialogTrigger>
              {openCustomerDialog && <CustomerDialog />}
            </Dialog>

            <div className="relative inline-block">
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 z-10 px-2 py-1 text-xs font-semibold"
              >
                Disabled
              </Badge>

              <Button
                variant="outline"
                className="h-12 flex-1 bg-transparent text-base font-semibold"
                disabled
              >
                <Download className="mr-2 h-5 w-5" />
                Import
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search customers..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="h-14 pl-10 !text-lg"
            />
          </div>
        </div>

        {customerStatus === "pending" ? (
          <div className="mt-8 flex justify-center gap-3">
            <div className="text-muted-foreground text-xl font-semibold">Loading</div>
            <LoaderCircle className="text-primary animate-spin" size={26} />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {customers && customers.length ? (
              <>
                {customers.map((customer, idx) => (
                  <div
                    key={customer.id}
                    className={`border-border hover:bg-accent/70 cursor-pointer border-b p-4 ${selectedCustomer?.id === customer.id ? "bg-accent" : "bg-background"} ${idx === customers.length - 1 ? "border-b-0" : ""}`}
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{customer.name}</h3>
                        <p className="text-muted-foreground text-sm">
                          {customer.contact || "No contact"}
                        </p>
                      </div>
                      <Badge className={getCustomerTypeColor(customer.customerType)}>
                        {customer.customerType || "N/A"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {customerSearch ? (
                  <div className="text-muted-foreground mt-8 mb-2 text-center text-xl font-semibold">
                    No Customers Found
                  </div>
                ) : (
                  <div className="mt-8 rounded-lg p-10 text-center">
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No customers yet</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Get started by adding your first customer.
                    </p>
                    <div className="mt-6">
                      <Button className="h-12 flex-1 text-base font-semibold">
                        <Plus className="mr-2 h-5 w-5" />
                        Add Customer
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};
