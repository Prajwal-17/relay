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
import useCustomers from "@/hooks/customers/useCustomers";
import { Label } from "@radix-ui/react-label";
import { createCustomerSchema, updateCustomerSchema } from "@shared/schemas/customers.schema";
import type { CreateCustomerPayload, UpdateCustomerPayload } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import z from "zod";

const addCustomer = async (payload: CreateCustomerPayload) => {
  try {
    const response = await fetch("http://localhost:3000/api/customers", {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.status === "success") {
      return data;
    }
    throw new Error(data.error.message);
  } catch (error) {
    throw new Error((error as Error).message);
  }
};

const updateCustomer = async (payload: UpdateCustomerPayload, customerId: string) => {
  try {
    const response = await fetch(`http://localhost:3000/api/customers/${customerId}`, {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.status === "success") {
      return data;
    }
    throw new Error(data.error.message);
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
    selectedCustomer,
    setSelectedCustomer,
    setOpenCustomerDialog,
    errors,
    setErrors
  } = useCustomers();

  const customerMutation = useMutation({
    mutationFn: async ({
      action,
      payload
    }:
      | {
          action: "add";
          payload: CreateCustomerPayload;
        }
      | {
          action: "edit";
          payload: UpdateCustomerPayload;
        }) => {
      if (action == "add") {
        return addCustomer(payload);
      } else {
        if (!selectedCustomer?.id) {
          throw new Error("Customer Id does not exist");
        }
        return updateCustomer(payload, selectedCustomer.id);
      }
    },
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
    let parseResult;
    if (action === "add") {
      parseResult = createCustomerSchema.safeParse(formData);
    } else {
      parseResult = updateCustomerSchema.safeParse(formData);
    }

    if (!parseResult.success) {
      const formatted = z.flattenError(parseResult.error);
      const errorRecord = { ...errors };

      for (const field in formatted.fieldErrors) {
        errorRecord[field] = formatted.fieldErrors[field]?.[0];
      }
      setErrors(errorRecord);
    }

    if (action === "add") {
      customerMutation.mutate({ action: action, payload: parseResult.data });
      return;
    }
    customerMutation.mutate({ action: action, payload: parseResult.data });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });

    const errorRecord = { ...errors };

    const result = updateCustomerSchema.safeParse({
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
    <DialogContent
      onOpenAutoFocus={(e) => {
        e.preventDefault();
      }}
      className="w-full max-w-3xl!"
    >
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
            className="h-12 text-lg!"
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
            className="h-12 text-lg!"
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
            <SelectTrigger className="h-12 text-lg!">
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
            disabled={customerMutation.isPending}
            className="hover:bg-primary/80 cursor-pointer"
            onClick={() => handleSubmit(actionType)}
          >
            {actionType === "add"
              ? customerMutation.isPending
                ? "Adding Customer..."
                : "Add Customer"
              : customerMutation.isPending
                ? "Updating Customer..."
                : "Update Customer"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};
