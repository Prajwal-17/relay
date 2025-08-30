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
import { useCustomerStore } from "@/store/customersStore";
import { Label } from "@radix-ui/react-label";
import toast from "react-hot-toast";

export const CustomerDialog = () => {
  const formData = useCustomerStore((state) => state.formData);
  const actionType = useCustomerStore((state) => state.actionType);
  const setFormData = useCustomerStore((state) => state.setFormData);
  const setOpenCustomerDialog = useCustomerStore((state) => state.setOpenCustomerDialog);

  const handleSubmit = async (action: "add" | "edit") => {
    try {
      if (action === "add") {
        setFormData({});
        const response = await window.customersApi.addNewCustomer(formData);
        if (response.status === "success") {
          toast.success(response.data);
          setOpenCustomerDialog();
          setFormData({});
        } else {
          toast.error(response.error.message);
          setOpenCustomerDialog();
          setFormData({});
        }
      } else if (action === "edit") {
        const response = await window.customersApi.updateCustomer(formData);
        if (response.status === "success") {
          toast.success(response.data);
          setOpenCustomerDialog();
          setFormData({});
        } else {
          toast.error(response.error.message);
          setOpenCustomerDialog();
          setFormData({});
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
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
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter customer name"
            required
            className="h-12 !text-lg"
          />
        </div>
        <div>
          <Label htmlFor="contact" className="mb-2 block">
            Contact
          </Label>
          <Input
            id="contact"
            value={formData.contact ?? ""}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            placeholder="Enter contact information"
            className="h-12 !text-lg"
          />
        </div>
        <div>
          <Label htmlFor="customerType" className="mb-2 block">
            Customer Type
          </Label>
          <Select
            value={formData.customerType}
            onValueChange={(value) => setFormData({ ...formData, customerType: value })}
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
