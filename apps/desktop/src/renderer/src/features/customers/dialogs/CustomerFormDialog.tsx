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
import { Textarea } from "@/components/ui/textarea";
import { useUpdateCustomer } from "@/features/customers/hooks/useUpdateCustomer";
import { apiClient } from "@/lib/apiClient";
import type { Customer, UpdateCustomerPayload } from "@shared/types";
import { rupeesToPaisa } from "@shared/utils/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LoaderCircle,
  MapPin,
  Phone,
  Tags,
  UserRound,
  WalletCards,
  X,
  type LucideIcon
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import toast from "react-hot-toast";

type FormState = {
  name: string;
  contact: string;
  customerType: string;
  openingBalance: string;
  address: string;
};

const emptyForm: FormState = {
  name: "",
  contact: "",
  customerType: "cash",
  openingBalance: "",
  address: ""
};

function formFromCustomer(c: Customer): FormState {
  return {
    name: c.name,
    contact: c.contact ?? "",
    customerType: c.customerType,
    openingBalance: "",
    address: c.address ?? ""
  };
}

function buildPayload(form: FormState, includeOpeningBalance: boolean) {
  return {
    name: form.name.trim(),
    contact: form.contact.trim() === "" ? null : form.contact.trim(),
    customerType: form.customerType,
    address: form.address.trim() === "" ? null : form.address.trim(),
    ...(includeOpeningBalance && form.openingBalance.trim() !== ""
      ? { openingBalance: rupeesToPaisa(Number(form.openingBalance)) }
      : {})
  };
}

function FormField({
  label,
  icon: Icon,
  required,
  error,
  children
}: {
  label: string;
  icon: LucideIcon;
  required?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
        <Icon aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-destructive text-xs font-medium">{error}</p>}
    </div>
  );
}

const selectOnFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

const onlyDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
const onlyUnsignedDecimal = (v: string) => {
  const parts = v.replace(/[^\d.]/g, "").split(".");
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
    mutationFn: (f) => apiClient.post<Customer>("/api/customers", buildPayload(f, true)),
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
    const payload = buildPayload(form, false) as Partial<UpdateCustomerPayload>;
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
        className="bg-card flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogHeader className="border-border shrink-0 border-b px-3 py-2.5 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>{mode === "add" ? "New customer" : "Edit customer"}</DialogTitle>
              <DialogDescription>
                {mode === "add"
                  ? "Add a new customer to your directory."
                  : "Update customer information."}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              onClick={onClose}
              aria-label="Close customer form"
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            <div className="col-span-2">
              <FormField
                label="Name"
                icon={UserRound}
                required
                error={nameInvalid ? "Name must be at least 3 characters" : null}
              >
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Enter customer name"
                  className="font-semibold"
                />
              </FormField>
            </div>

            <FormField
              label="Contact"
              icon={Phone}
              error={contactInvalid ? "Must be 10 digits" : null}
            >
              <Input
                value={form.contact}
                onChange={(e) => set("contact", onlyDigits(e.target.value, 10))}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit phone"
                className="font-medium tabular-nums"
              />
            </FormField>

            <FormField label="Type" icon={Tags}>
              <Select value={form.customerType} onValueChange={(v) => set("customerType", v)}>
                <SelectTrigger className="font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {mode === "add" && (
              <FormField label="Opening balance (₹)" icon={WalletCards}>
                <Input
                  inputMode="decimal"
                  min={0}
                  value={form.openingBalance}
                  onChange={(e) => set("openingBalance", onlyUnsignedDecimal(e.target.value))}
                  onFocus={selectOnFocus}
                  placeholder="Optional"
                  className="font-medium tabular-nums"
                />
              </FormField>
            )}

            <div className="col-span-2">
              <FormField label="Address" icon={MapPin}>
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

        <DialogFooter className="border-border shrink-0 border-t px-3 py-3">
          <Button
            variant="outline"
            className="cursor-pointer font-semibold"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className="cursor-pointer font-semibold"
            disabled={!canSave || saving}
            onClick={handleSave}
          >
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            {mode === "add" ? "Add customer" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
