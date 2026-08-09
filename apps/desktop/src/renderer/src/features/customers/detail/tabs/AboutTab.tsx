import { Button } from "@/components/ui/button";
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
import { useCustomer } from "@/features/customers/hooks/useCustomer";
import { useUpdateCustomer } from "@/features/customers/hooks/useUpdateCustomer";
import type { Customer, UpdateCustomerPayload } from "@shared/types";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import { Check, Copy, LoaderCircle, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { SectionCard } from "../SectionCard";

type BasicInfoForm = {
  name: string;
  contact: string;
  customerType: string;
};

type AddressForm = { address: string };

type EditingSection = "basic" | "address" | null;

const EMPTY_BASIC: BasicInfoForm = {
  name: "",
  contact: "",
  customerType: "cash"
};

const EMPTY_ADDRESS: AddressForm = { address: "" };

function basicInfoFromCustomer(c: Customer): BasicInfoForm {
  return {
    name: c.name,
    contact: c.contact ?? "",
    customerType: c.customerType
  };
}

function addressFromCustomer(c: Customer): AddressForm {
  return { address: c.address ?? "" };
}

function basicInfoDirty(c: Customer, f: BasicInfoForm) {
  const dirty: Record<string, unknown> = {};
  if (f.name.trim() !== c.name) dirty.name = f.name.trim();
  const contact = f.contact.trim() === "" ? null : f.contact.trim();
  if (contact !== c.contact) dirty.contact = contact;
  if (f.customerType !== c.customerType) dirty.customerType = f.customerType;
  return dirty;
}

function addressDirty(c: Customer, f: AddressForm) {
  const dirty: Record<string, unknown> = {};
  const address = f.address.trim() === "" ? null : f.address.trim();
  if (address !== c.address) dirty.address = address;
  return dirty;
}

function DisplayField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-muted/40 border-border/70 flex flex-col gap-1.5 rounded-lg border px-4 py-3">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground text-base font-medium wrap-break-word">{value || "—"}</dd>
    </div>
  );
}

function FieldShell({
  label,
  htmlFor,
  error,
  children
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={htmlFor}
        className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
      >
        {label}
      </Label>
      {children}
      {error && <p className="text-destructive text-xs font-medium">{error}</p>}
    </div>
  );
}

export function AboutTab({ customerId }: { customerId: string }) {
  const { customer } = useCustomer(customerId);
  const updateMutation = useUpdateCustomer();

  const [editing, setEditing] = useState<EditingSection>(null);
  const [basicForm, setBasicForm] = useState<BasicInfoForm>(EMPTY_BASIC);
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS);

  useEffect(() => {
    if (!customer) return;
    if (editing === "basic") setBasicForm(basicInfoFromCustomer(customer));
    if (editing === "address") setAddressForm(addressFromCustomer(customer));
  }, [editing, customer]);

  if (!customer) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderCircle className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  const saving = updateMutation.isPending;

  const setBasic = (field: keyof BasicInfoForm, value: string) =>
    setBasicForm((prev) => ({ ...prev, [field]: value }));

  const nameInvalid = basicForm.name.trim().length < 3;
  const contactInvalid = basicForm.contact.trim() !== "" && basicForm.contact.trim().length !== 10;
  const canSaveBasic = !nameInvalid && !contactInvalid && !saving;

  const startEdit = (section: EditingSection) => setEditing(section);
  const cancelEdit = () => setEditing(null);

  const saveBasic = () => {
    if (!canSaveBasic) return;
    const dirty = basicInfoDirty(customer, basicForm);
    if (Object.keys(dirty).length === 0) {
      setEditing(null);
      return;
    }
    updateMutation.mutate(
      { id: customerId, payload: dirty as Partial<UpdateCustomerPayload> },
      { onSuccess: () => setEditing(null) }
    );
  };

  const saveAddress = () => {
    const dirty = addressDirty(customer, addressForm);
    if (Object.keys(dirty).length === 0) {
      setEditing(null);
      return;
    }
    updateMutation.mutate(
      { id: customerId, payload: dirty as Partial<UpdateCustomerPayload> },
      { onSuccess: () => setEditing(null) }
    );
  };

  const editAction = (onSave: () => void) => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-9 cursor-pointer"
        onClick={cancelEdit}
        disabled={saving}
      >
        <X className="size-4" />
        Cancel
      </Button>
      <Button
        size="sm"
        className="hover:bg-primary-hover h-9 cursor-pointer"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
        Save
      </Button>
    </div>
  );

  const displayAction = (section: EditingSection) => (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground h-9 cursor-pointer"
      onClick={() => startEdit(section)}
      disabled={editing !== null}
    >
      <Pencil className="size-4" />
      Edit
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Basic Info"
        action={editing === "basic" ? editAction(saveBasic) : displayAction("basic")}
      >
        {editing === "basic" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldShell
              label="Name"
              htmlFor="about-name"
              error={nameInvalid ? "Name must be at least 3 characters" : null}
            >
              <Input
                id="about-name"
                value={basicForm.name}
                onChange={(e) => setBasic("name", e.target.value)}
                className="h-10"
                placeholder="Customer name"
              />
            </FieldShell>
            <FieldShell
              label="Contact"
              htmlFor="about-contact"
              error={contactInvalid ? "Contact must be 10 digits" : null}
            >
              <Input
                id="about-contact"
                value={basicForm.contact}
                onChange={(e) => setBasic("contact", e.target.value)}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit phone"
                className="h-10 tabular-nums"
              />
            </FieldShell>
            <FieldShell label="Type" htmlFor="about-type">
              <Select
                value={basicForm.customerType}
                onValueChange={(v) => setBasic("customerType", v)}
              >
                <SelectTrigger id="about-type" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                </SelectContent>
              </Select>
            </FieldShell>
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DisplayField label="Name" value={customer.name} />
            <DisplayField label="Contact" value={customer.contact} />
            <DisplayField label="Type" value={customer.customerType} />
            <DisplayField
              label="Outstanding"
              value={formatRupee(customer.outstandingBalance ?? 0)}
            />
          </dl>
        )}
      </SectionCard>

      <SectionCard
        title="Address"
        action={editing === "address" ? editAction(saveAddress) : displayAction("address")}
      >
        {editing === "address" ? (
          <Textarea
            value={addressForm.address}
            onChange={(e) => setAddressForm({ address: e.target.value })}
            placeholder="Street, area, city, state, PIN"
            className="min-h-24 resize-y text-base"
          />
        ) : (
          <p className="text-foreground text-base font-medium whitespace-pre-line">
            {customer.address || "No address on file."}
          </p>
        )}
      </SectionCard>

      <SectionCard title="Metadata">
        <div className="flex flex-col gap-3">
          <div className="bg-muted/40 border-border/70 flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Customer ID
              </dt>
              <dd className="text-foreground font-mono text-base font-medium break-all tabular-nums">
                {customer.id}
              </dd>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(customer.id);
                toast.success("ID copied to clipboard");
              }}
              className="text-muted-foreground hover:text-foreground hover:bg-hover flex size-9 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors"
              title="Copy ID"
            >
              <Copy className="size-4" />
            </button>
          </div>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DisplayField
              label="Created"
              value={customer.createdAt ? formatDateStrToISTDateTimeStr(customer.createdAt) : "—"}
            />
            <DisplayField
              label="Last Updated"
              value={customer.updatedAt ? formatDateStrToISTDateTimeStr(customer.updatedAt) : "—"}
            />
          </dl>
        </div>
      </SectionCard>
    </div>
  );
}
