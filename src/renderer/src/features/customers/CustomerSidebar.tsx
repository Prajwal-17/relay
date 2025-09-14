import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import useCustomerSidebar from "@/hooks/useCustomerSidebar";
import { Download, Plus, Search } from "lucide-react";
import { CustomerDialog } from "./CustomerDialog";
import { getCustomerTypeColor } from "./CustomerTypeColor";
import { GoogleContactsImportDialog } from "./GoogleContactsImportDialog";

export const CustomerSidebar = () => {
  const {
    customers,
    selectedCustomer,
    openCustomerDialog,
    searchTerm,
    openContactDialog,
    setFormData,
    setActionType,
    setOpenCustomerDialog,
    setOpenContactDialog,
    importContactFromGoogle,
    setLoading,
    setSearchTerm,
    setSelectedCustomer
  } = useCustomerSidebar();

  return (
    <>
      <div className="border-border bg-card w-96 border-r">
        <div className="border-border border-b p-4">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Customers</h2>
          </div>

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
                <Button className="h-12 flex-1 text-base font-semibold">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Customer
                </Button>
              </DialogTrigger>
              {openCustomerDialog && <CustomerDialog />}
            </Dialog>
            <Dialog
              open={openContactDialog}
              onOpenChange={() => {
                setOpenContactDialog();
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    importContactFromGoogle();
                    setLoading();
                  }}
                  variant="outline"
                  className="h-12 flex-1 bg-transparent text-base font-semibold"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Import
                </Button>
              </DialogTrigger>
              {openContactDialog && <GoogleContactsImportDialog />}
            </Dialog>
          </div>

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-10 !text-lg"
            />
          </div>
          <div>
            {customers.map((customer, idx) => (
              <div
                key={customer.id}
                className={`border-border hover:bg-accent cursor-pointer border-b p-4 transition-colors ${
                  selectedCustomer?.id === customer.id ? "bg-accent" : ""
                } ${idx === customers.length - 1 ? "border-b-0" : ""}`}
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
          </div>
        </div>
      </div>
    </>
  );
};
