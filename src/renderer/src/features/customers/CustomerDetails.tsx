import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import useCustomers from "@/hooks/customers/useCustomers";
import { apiClient } from "@/lib/apiClient";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { CustomerSummaryCard } from "./CustomerSummaryCard";
import { getCustomerTypeColor } from "./CustomerTypeColor";

export const CustomerDetails = () => {
  const queryClient = useQueryClient();

  const {
    selectedCustomer,
    setSelectedCustomer,
    openCustomerDialog,
    setOpenCustomerDialog,
    setActionType,
    setFormData,
    customerSearch,
    setCustomerSearch
  } = useCustomers();

  const mutation = useMutation({
    mutationFn: (customerId: string) => apiClient.delete(`/api/customers/${customerId}`),
    onSuccess: () => {
      setSelectedCustomer(null);
      setCustomerSearch("");
      queryClient.invalidateQueries({ queryKey: ["customers", customerSearch] });
      toast.success("Successfully deleted customer");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  if (!selectedCustomer) return;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{selectedCustomer.name}</h1>
            {selectedCustomer.customerType && (
              <Badge
                className={`px-3 py-1 text-sm ${getCustomerTypeColor(selectedCustomer.customerType)}`}
              >
                {selectedCustomer.customerType}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-lg">Customer Details</p>
          {selectedCustomer.contact && (
            <div className="mt-1">
              <Label className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                Contact
              </Label>
              <p className="mt-2 text-lg">{selectedCustomer.contact}</p>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Dialog
            open={openCustomerDialog}
            onOpenChange={() => {
              setActionType("edit");
              setOpenCustomerDialog();
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setFormData(selectedCustomer);
                  setActionType("edit");
                }}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="default" className="cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-destructive">
                  This action cannot be undone. This will permanently delete customer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={mutation.isPending}
                  className="bg-destructive hover:bg-destructive/80 text-destructive-foreground cursor-pointer font-semibold"
                  onClick={() => {
                    if (!selectedCustomer) {
                      toast.error("Customer not selected");
                    }
                    mutation.mutate(selectedCustomer.id);
                  }}
                >
                  {mutation.isPending ? "Deleting ..." : "Confirm Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <CustomerSummaryCard customer={selectedCustomer} />
    </>
  );
};
