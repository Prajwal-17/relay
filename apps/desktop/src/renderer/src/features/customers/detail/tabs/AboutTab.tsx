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
import { CustomerTypeBadge } from "@/features/customers/CustomerTypeBadge";
import { useCustomer } from "@/features/customers/hooks/useCustomer";
import { useUpdateCustomer } from "@/features/customers/hooks/useUpdateCustomer";
import type { Customer, UpdateCustomerPayload } from "@shared/types";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import { formatRupee } from "@shared/utils/utils";
import {
  CalendarPlus,
  Check,
  Clock3,
  Copy,
  Fingerprint,
  LoaderCircle,
  Pencil,
  Phone,
  Tags,
  UserRound,
  WalletCards,
  X,
  type LucideIcon
} from "lucide-react";
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

function DisplayField({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value?: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 py-1">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        {label}
      </dt>
      <dd className="text-foreground text-base font-medium wrap-break-word">{value || "—"}</dd>
    </div>
  );
}

function FieldShell({
  label,
  icon: Icon,
  htmlFor,
  error,
  children
}: {
  label: string;
  icon: LucideIcon;
  htmlFor?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={htmlFor}
        className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase"
      >
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
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
        className="cursor-pointer"
        onClick={cancelEdit}
        disabled={saving}
      >
        <X className="size-4" />
        Cancel
      </Button>
      <Button size="sm" className="cursor-pointer" onClick={onSave} disabled={saving}>
        {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
        Save
      </Button>
    </div>
  );

  const displayAction = (section: EditingSection) => (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground cursor-pointer"
      onClick={() => startEdit(section)}
      disabled={editing !== null}
    >
      <Pencil className="size-4" />
      Edit
    </Button>
  );

  return (
    <div className="flex flex-col gap-3">
      <SectionCard
        title="Basic Info"
        action={editing === "basic" ? editAction(saveBasic) : displayAction("basic")}
      >
        {editing === "basic" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FieldShell
              label="Name"
              icon={UserRound}
              htmlFor="about-name"
              error={nameInvalid ? "Name must be at least 3 characters" : null}
            >
              <Input
                id="about-name"
                value={basicForm.name}
                onChange={(e) => setBasic("name", e.target.value)}
                placeholder="Customer name"
              />
            </FieldShell>
            <FieldShell
              label="Contact"
              icon={Phone}
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
                className="tabular-nums"
              />
            </FieldShell>
            <FieldShell label="Type" icon={Tags} htmlFor="about-type">
              <Select
                value={basicForm.customerType}
                onValueChange={(v) => setBasic("customerType", v)}
              >
                <SelectTrigger id="about-type">
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
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <DisplayField label="Name" value={customer.name} icon={UserRound} />
            <DisplayField label="Contact" value={customer.contact} icon={Phone} />
            <DisplayField
              label="Type"
              value={
                <CustomerTypeBadge
                  customerType={customer.customerType}
                  className="py-0.5 text-sm"
                />
              }
              icon={Tags}
            />
            <DisplayField
              label="Outstanding"
              icon={WalletCards}
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
            className="min-h-24 resize-y"
          />
        ) : (
          <p className="text-foreground text-base font-medium whitespace-pre-line">
            {customer.address || "No address on file."}
          </p>
        )}
      </SectionCard>

      <SectionCard title="Metadata">
        <div className="flex flex-col gap-3">
          <div className="border-border flex items-center justify-between gap-3 border-b pb-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                <Fingerprint aria-hidden="true" className="size-3.5 shrink-0" />
                Customer ID
              </dt>
              <dd className="text-foreground font-mono text-base font-medium break-all tabular-nums">
                {customer.id}
              </dd>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                navigator.clipboard.writeText(customer.id);
                toast.success("ID copied to clipboard");
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Copy customer ID"
              title="Copy customer ID"
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <DisplayField
              label="Created"
              icon={CalendarPlus}
              value={customer.createdAt ? formatDateStrToISTDateTimeStr(customer.createdAt) : "—"}
            />
            <DisplayField
              label="Last Updated"
              icon={Clock3}
              value={customer.updatedAt ? formatDateStrToISTDateTimeStr(customer.updatedAt) : "—"}
            />
          </dl>
        </div>
      </SectionCard>
    </div>
  );
}
