import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import type { CustomerMock, CustomerType } from "../_mock/types";

type FormState = {
  name: string;
  contact: string;
  customerType: CustomerType;
  gstin: string;
  billingAddress: string;
  shippingAddress: string;
  openingBalance: string;
  creditLimit: string;
};

const emptyForm: FormState = {
  name: "",
  contact: "",
  customerType: "cash",
  gstin: "",
  billingAddress: "",
  shippingAddress: "",
  openingBalance: "",
  creditLimit: ""
};

export function CustomerFormDialog({
  mode,
  customer,
  onClose
}: {
  mode: "add" | "edit";
  customer: CustomerMock | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (mode === "edit" && customer) {
      setForm({
        name: customer.name,
        contact: customer.contact ?? "",
        customerType: customer.customerType,
        gstin: customer.gstin ?? "",
        billingAddress: customer.billingAddress ?? "",
        shippingAddress: customer.shippingAddress ?? "",
        openingBalance: String(customer.openingBalance),
        creditLimit: String(customer.creditLimit)
      });
    } else {
      setForm(emptyForm);
    }
  }, [mode, customer]);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSave = form.name.trim().length > 0;

  const inputCls = "h-9";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card shadow-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Customer" : "Edit Customer"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a new customer record with billing details."
              : "Update customer information."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="cust-name">Name *</Label>
            <Input
              id="cust-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Enter customer name"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cust-contact">Contact</Label>
            <Input
              id="cust-contact"
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder="Phone or email"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cust-type">Customer Type</Label>
            <Select
              value={form.customerType}
              onValueChange={(v) => set("customerType", v as CustomerType)}
            >
              <SelectTrigger id="cust-type" className={inputCls}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cust-gstin">GSTIN</Label>
            <Input
              id="cust-gstin"
              value={form.gstin}
              onChange={(e) => set("gstin", e.target.value.toUpperCase())}
              placeholder="29ABCDE1234F1Z5"
              className={`${inputCls} tabular-nums`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cust-opening">Opening Balance (₹)</Label>
            <Input
              id="cust-opening"
              type="number"
              inputMode="decimal"
              value={form.openingBalance}
              onChange={(e) => set("openingBalance", e.target.value)}
              placeholder="0"
              className={`${inputCls} tabular-nums`}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="cust-credit">Credit Limit (₹)</Label>
            <Input
              id="cust-credit"
              type="number"
              inputMode="decimal"
              value={form.creditLimit}
              onChange={(e) => set("creditLimit", e.target.value)}
              placeholder="0"
              className={`${inputCls} tabular-nums`}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="cust-billing">Billing Address</Label>
            <Input
              id="cust-billing"
              value={form.billingAddress}
              onChange={(e) => set("billingAddress", e.target.value)}
              placeholder="Street, city, state, PIN"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="cust-shipping">Shipping Address</Label>
            <textarea
              id="cust-shipping"
              value={form.shippingAddress}
              onChange={(e) => set("shippingAddress", e.target.value)}
              placeholder="Street, city, state, PIN"
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-16 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="hover:bg-primary-hover cursor-pointer"
            disabled={!canSave}
            onClick={onClose}
          >
            {mode === "add" ? "Add Customer" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
