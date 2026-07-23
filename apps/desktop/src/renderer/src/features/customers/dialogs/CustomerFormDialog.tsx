import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateCustomer } from "@/hooks/customers/useUpdateCustomer";
import { apiClient } from "@/lib/apiClient";
import type { Customer, UpdateCustomerPayload } from "@shared/types";
import { paisaToRupees, rupeesToPaisa } from "@shared/utils/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

type FormState = {
  name: string;
  contact: string;
  customerType: string;
  creditLimit: string;
  outstandingBalance: string;
  address: string;
};

const emptyForm: FormState = {
  name: "",
  contact: "",
  customerType: "cash",
  creditLimit: "",
  outstandingBalance: "",
  address: ""
};

function formFromCustomer(c: Customer): FormState {
  return {
    name: c.name,
    contact: c.contact ?? "",
    customerType: c.customerType,
    creditLimit:
      c.creditLimit != null && c.creditLimit !== 0 ? String(paisaToRupees(c.creditLimit)) : "",
    outstandingBalance:
      c.outstandingBalance != null && c.outstandingBalance !== 0
        ? String(paisaToRupees(c.outstandingBalance))
        : "",
    address: c.address ?? ""
  };
}

function buildPayload(form: FormState) {
  return {
    name: form.name.trim(),
    contact: form.contact.trim() === "" ? null : form.contact.trim(),
    customerType: form.customerType,
    creditLimit: form.creditLimit.trim() === "" ? 0 : rupeesToPaisa(Number(form.creditLimit)),
    outstandingBalance:
      form.outstandingBalance.trim() === "" ? 0 : rupeesToPaisa(Number(form.outstandingBalance)),
    address: form.address.trim() === "" ? null : form.address.trim()
  };
}

function FormField({
  label,
  required,
  error,
  children
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground text-sm font-semibold">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-destructive text-sm font-medium">{error}</p>}
    </div>
  );
}

const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

const onlyDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
const onlyUnsignedDecimal = (v: string) => {
  const parts = v.replace(/[^\d.]/g, "").split(".");
  return parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : (parts[0] ?? "");
};
const onlySignedDecimal = (v: string) => {
  let out = v.replace(/[^\d.-]/g, "");
  if (out.includes("-")) out = `-${out.replace(/-/g, "")}`;
  const parts = out.split(".");
  return parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : (parts[0] ?? "");
};

export function CustomerFormDialog({
  mode,
  customer,
  onClose
}: {
  mode: "add" | "edit";
  customer: Customer | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateCustomer();

  const createMutation = useMutation<Customer, Error, FormState>({
    mutationFn: (f) => apiClient.post<Customer>("/api/customers", buildPayload(f)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers-infinite"], exact: false });
      toast.success("Customer created");
      onClose();
    },
    onError: (error) => toast.error(error.message)
  });

  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    setForm(mode === "edit" && customer ? formFromCustomer(customer) : emptyForm);
  }, [mode, customer]);

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const nameInvalid = form.name.trim().length < 3;
  const contactInvalid = form.contact.trim() !== "" && form.contact.trim().length !== 10;
  const canSave = !nameInvalid && !contactInvalid;
  const saving = updateMutation.isPending || createMutation.isPending;

  const handleSave = () => {
    if (!canSave || saving) return;
    const payload = buildPayload(form) as Partial<UpdateCustomerPayload>;
    if (mode === "edit" && customer) {
      updateMutation.mutate({ id: customer.id, payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => saving && e.preventDefault()}
        className="bg-card flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-xl"
      >
        <div className="border-border/70 flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-foreground text-lg font-bold tracking-tight">
              {mode === "add" ? "New Customer" : "Edit Customer"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {mode === "add"
                ? "Add a new customer to your directory"
                : "Update customer information"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            <div className="col-span-2">
              <FormField
                label="Name"
                required
                error={nameInvalid ? "Name must be at least 3 characters" : null}
              >
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Enter customer name"
                  className="h-9 text-sm! font-semibold"
                />
              </FormField>
            </div>

            <FormField label="Contact" error={contactInvalid ? "Must be 10 digits" : null}>
              <Input
                value={form.contact}
                onChange={(e) => set("contact", onlyDigits(e.target.value, 10))}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit phone"
                className="h-9 text-sm! font-medium tabular-nums"
              />
            </FormField>

            <FormField label="Type">
              <Select value={form.customerType} onValueChange={(v) => set("customerType", v)}>
                <SelectTrigger className="h-9 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="text-md!" value="cash">
                    Cash
                  </SelectItem>
                  <SelectItem className="text-md!" value="account">
                    Account
                  </SelectItem>
                  <SelectItem className="text-md!" value="hotel">
                    Hotel
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Credit Limit (₹)">
              <Input
                inputMode="decimal"
                min={0}
                value={form.creditLimit}
                onChange={(e) => set("creditLimit", onlyUnsignedDecimal(e.target.value))}
                onFocus={selectOnFocus}
                placeholder="0"
                className="h-9 text-sm! font-medium tabular-nums"
              />
            </FormField>

            <FormField label="Outstanding (₹)">
              <Input
                inputMode="decimal"
                value={form.outstandingBalance}
                onChange={(e) => set("outstandingBalance", onlySignedDecimal(e.target.value))}
                onFocus={selectOnFocus}
                placeholder="0"
                className="h-9 text-sm! font-medium tabular-nums"
              />
            </FormField>

            <div className="col-span-2">
              <FormField label="Address">
                <Textarea
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Street, area, city, state, PIN"
                  className="min-h-16 resize-y text-sm font-medium"
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="border-border/70 flex items-center justify-end gap-3 border-t px-4 py-3">
          <Button
            variant="outline"
            className="h-9 cursor-pointer px-4 text-sm font-semibold"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className="hover:bg-primary-hover h-9 cursor-pointer px-4 text-sm font-semibold"
            disabled={!canSave || saving}
            onClick={handleSave}
          >
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            {mode === "add" ? "Add Customer" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
