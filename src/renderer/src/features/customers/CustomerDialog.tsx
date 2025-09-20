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
import { CustomerSchema } from "@/lib/validation";
import { useCustomerStore } from "@/store/customersStore";
import { Label } from "@radix-ui/react-label";
import { useState } from "react";
import toast from "react-hot-toast";
import z from "zod";

export const CustomerDialog = () => {
  const formData = useCustomerStore((state) => state.formData);
  const actionType = useCustomerStore((state) => state.actionType);
  const setFormData = useCustomerStore((state) => state.setFormData);
  const setOpenCustomerDialog = useCustomerStore((state) => state.setOpenCustomerDialog);
  const setRefreshState = useCustomerStore((state) => state.setRefreshState);
  const setSelectedCustomer = useCustomerStore((state) => state.setSelectedCustomer);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (action: "add" | "edit") => {
    const result = CustomerSchema.safeParse(formData);

    if (!result.success) {
      const formatted = z.flattenError(result.error);
      const errorRecord = { ...errors };

      for (const field in formatted.fieldErrors) {
        errorRecord[field] = formatted.fieldErrors[field]?.[0];
      }
      setErrors(errorRecord);
    } else {
      try {
        if (action === "add") {
          const response = await window.customersApi.addNewCustomer(formData);
          if (response.status === "success") {
            toast.success(response.data);
            setOpenCustomerDialog();
            setFormData({});
            setRefreshState(true);
          } else {
            toast.error(response.error.message);
          }
        } else if (action === "edit") {
          const response = await window.customersApi.updateCustomer(formData);
          if (response.status === "success") {
            toast.success(response?.message || "Customer updated successfully");
            setOpenCustomerDialog();
            setSelectedCustomer(response.data);
            setFormData({});
            setRefreshState(true);
          } else {
            toast.error(response.error.message);
          }
        }
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong");
        setRefreshState(true);
      }
    }
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
        <DialogTitle>{actionType === "add" ? "Add New Product" : "Edit Product"}</DialogTitle>
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
          {errors.name && <div className="text-red-500">{errors.name}</div>}
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
          {errors.contact && <div className="text-red-500">{errors.contact}</div>}
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
          {errors.customerType && <div className="text-red-500">{errors.customerType}</div>}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpenCustomerDialog()}>
            Cancel
          </Button>
          <Button onClick={() => handleSubmit(actionType)}>
            {actionType === "add" ? "Add Customer" : "Update Customer"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};
