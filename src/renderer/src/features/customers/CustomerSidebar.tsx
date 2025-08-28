import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomerStore } from "@/store/customersStore";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import type { CustomersType } from "@shared/types";
import { Download, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CustomerDialog } from "./CustomerDialog";

export const CustomerSidebar = () => {
  // temp state
  const [customers, setCustomers] = useState<CustomersType[]>([]);

  const selectedCustomer = useCustomerStore((state) => state.selectedCustomer);
  const setSelectedCustomer = useCustomerStore((state) => state.setSelectedCustomer);
  const [searchTerm, setSearchTerm] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const setOpenCustomerDialog = useCustomerStore((state) => state.setOpenCustomerDialog);
  const openCustomerDialog = useCustomerStore((state) => state.openCustomerDialog);
  const setFormData = useCustomerStore((state) => state.setFormData);

  const getCustomerTypeColor = (type: string | null) => {
    switch (type) {
      case "cash":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "account":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "hotel":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  useEffect(() => {
    async function getAllCustomers() {
      try {
        const response = await window.customersApi.getAllCustomers();
        if (response.status === "success") {
          console.log(response);
          setCustomers(response.data);
        } else {
          console.log(response);
          toast.error("Something went wrong in getting customers");
        }
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong");
      }
    }
    getAllCustomers();
  }, []);

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
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 flex-1 bg-transparent text-base font-semibold"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Import
                </Button>
              </DialogTrigger>
              {/* <GoogleContactsImportDialog onImport={handleImportContacts} /> */}
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
          <div className="overflow-y-auto">
            {customers.map((customer, idx) => (
              <div
                key={customer.id}
                className={`border-border hover:bg-accent cursor-pointer border-b p-4 transition-colors ${
                  selectedCustomer === customer.id ? "bg-accent" : ""
                } ${idx === customers.length - 1 ? "border-b-0" : ""}`}
                onClick={() => setSelectedCustomer(customer.id)}
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
