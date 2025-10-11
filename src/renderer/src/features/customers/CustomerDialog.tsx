import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import useCustomers from "@/hooks/useCustomers";
import { CustomerSchema } from "@/lib/validation";
import { Label } from "@radix-ui/react-label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import z from "zod";

const saveCustomer = async ({ action, data }) => {
  try {
    if (action === "add") {
      const response = await window.customersApi.addNewCustomer(data);
      if (response.status === "success") {
        return response;
      }
      return response;
    } else if (action === "edit") {
      const response = await window.customersApi.updateCustomer(data);
      if (response.status === "success") {
        return response;
      }
      return response;
    }
    throw new Error("Something went wrong");
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

export const CustomerDialog = () => {
  const queryClient = useQueryClient();
  const {
    formData,
    actionType,
    setFormData,
    setSelectedCustomer,
    setOpenCustomerDialog,
    errors,
    setErrors
  } = useCustomers();

  const mutation = useMutation({
    mutationFn: saveCustomer,
    onSuccess: (response) => {
      if (response.status === "success") {
        setOpenCustomerDialog();
        setFormData({});
        setSelectedCustomer(response.data);
        queryClient.invalidateQueries({ queryKey: ["customers"], exact: false });
        toast.success(
          typeof response.data === "string"
            ? response.data
            : (response.message ?? "Customer updated Successfully")
        );
      } else if (response.status === "error") {
        toast.error(response.error.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = async (action: "add" | "edit") => {
    setErrors({});
    const result = CustomerSchema.safeParse(formData);

    if (!result.success) {
      const formatted = z.flattenError(result.error);
      const errorRecord = { ...errors };

      for (const field in formatted.fieldErrors) {
        errorRecord[field] = formatted.fieldErrors[field]?.[0];
      }
      setErrors(errorRecord);
    }
    mutation.mutate({ action: action, data: result.data });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });

    const errorRecord = { ...errors };

    const result = CustomerSchema.safeParse({
      ...formData,
      [field]: value
    });

    if (!result.success) {
      const formatted = z.flattenError(result.error);
      errorRecord[field] = formatted.fieldErrors[field]?.[0];
      setErrors(errorRecord);
    } else {
      delete errorRecord[field];
      setErrors(errorRecord);
    }
  };

  return (
    <DialogContent className="w-full !max-w-3xl">
      <DialogHeader>
        <DialogTitle>{actionType === "add" ? "Add New Customer" : "Edit Customer"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="mb-2 block">
            Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter customer name"
            required
            className="h-12 !text-lg"
          />
          {errors.name && <div className="text-destructive">{errors.name}</div>}
        </div>
        <div>
          <Label htmlFor="contact" className="mb-2 block">
            Contact
          </Label>
          <Input
            id="contact"
            value={formData.contact ?? ""}
            onChange={(e) => handleInputChange("contact", e.target.value)}
            placeholder="Enter contact information"
            className="h-12 !text-lg"
          />
          {errors.contact && <div className="text-destructive">{errors.contact}</div>}
        </div>
        <div>
          <Label htmlFor="customerType" className="mb-2 block">
            Customer Type
          </Label>
          <Select
            value={formData.customerType}
            onValueChange={(value) => handleInputChange("customerType", value)}
          >
            <SelectTrigger className="h-12 !text-lg">
              <SelectValue placeholder="Select customer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="hotel">Hotel</SelectItem>
            </SelectContent>
          </Select>
          {errors.customerType && <div className="text-destructive">{errors.customerType}</div>}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => setOpenCustomerDialog()}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending}
            className="hover:bg-primary/80 cursor-pointer"
            onClick={() => handleSubmit(actionType)}
          >
            {actionType === "add"
              ? mutation.isPending
                ? "Adding Customer..."
                : "Add Customer"
              : mutation.isPending
                ? "Updating Customer..."
                : "Update Customer"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};
