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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useCustomers from "@/hooks/useCustomers";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { Label } from "@radix-ui/react-label";
import type { ApiResponse } from "@shared/types";
import { formatDateStr } from "@shared/utils/dateUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getCustomerTypeColor } from "./CustomerTypeColor";

const handleDelete = async (customerId: string) => {
  try {
    const response = await window.customersApi.deleteCustomer(customerId);
    return response;
  } catch (error) {
    throw new Error((error as Error).message ?? "Something went wrong");
  }
};

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

  const mutation = useMutation<ApiResponse<string>, Error, string>({
    mutationFn: (customerId: string) => handleDelete(customerId),
    onSuccess: (response) => {
      if (response.status === "success") {
        setSelectedCustomer(null);
        setCustomerSearch("");
        queryClient.invalidateQueries({ queryKey: ["customers", customerSearch] });
        toast.success(response.data);
      } else if (response.status === "error") {
        toast.error(response.error.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  if (!selectedCustomer) return;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{selectedCustomer.name}</h1>
          <p className="text-muted-foreground text-lg">Customer Details</p>
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
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="default">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-900">
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-red-700">
                  This action cannot be undone. This will permanently delete customer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/80"
                  onClick={() => {
                    if (!selectedCustomer) {
                      toast.error("Customer not selected");
                    }
                    mutation.mutate(selectedCustomer.id);
                  }}
                >
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <div>
              <Label className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                Name
              </Label>
              <p className="mt-2 text-lg font-medium">{selectedCustomer.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                Contact
              </Label>
              <p className="mt-2 text-lg">{selectedCustomer.contact}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                Type
              </Label>
              <div className="mt-2">
                <Badge
                  className={`px-3 py-1 text-sm ${getCustomerTypeColor(selectedCustomer.customerType)}`}
                >
                  {selectedCustomer.customerType}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                Created
              </Label>
              <p className="mt-2 text-lg">{formatDateStr(selectedCustomer.createdAt)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                Updated
              </Label>
              <p className="mt-2 text-lg">{formatDateStr(selectedCustomer.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
