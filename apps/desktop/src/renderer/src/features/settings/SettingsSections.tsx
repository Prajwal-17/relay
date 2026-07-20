import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import type { AppPreferencesResponse, Customer, StoreProfile } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, FolderOpen, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SettingsField } from "./SettingsField";

const inputClass = "h-12 text-base! font-medium";
const selectTriggerClass = "h-11 text-base w-full";

const SectionHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <header>
    <h2 className="text-foreground text-3xl font-semibold tracking-tight">{title}</h2>
    <p className="text-muted-foreground mt-2 text-base leading-7">{subtitle}</p>
  </header>
);

export const StoreProfileSettingsPage = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["storeProfile"],
    queryFn: () => apiClient.get<StoreProfile>("/api/store-profile")
  });

  const [form, setForm] = useState<Partial<StoreProfile>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        storeName: profile.storeName,
        ownerName: profile.ownerName,
        phone: profile.phone,
        email: profile.email,
        addressLine1: profile.addressLine1,
        addressLine2: profile.addressLine2,
        country: profile.country,
        state: profile.state,
        city: profile.city,
        pincode: profile.pincode,
        gstin: profile.gstin
      });
    }
  }, [profile]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Partial<StoreProfile>) =>
      apiClient.patch<StoreProfile>("/api/store-profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storeProfile"] });
      setIsDirty(false);
      toast.success("Store profile updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update store profile");
    }
  });

  const updateField = (key: keyof StoreProfile, value: string | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!isDirty) return;
    mutation.mutate(form);
  };

  if (isLoading) {
    return (
      <section>
        <SectionHeading
          title="Store Profile"
          subtitle="Manage your store identity shown on bills and export documents."
        />
        <div className="mt-12 flex items-center justify-center">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeading
        title="Store Profile"
        subtitle="Manage your store identity shown on bills and export documents."
      />
      <div className="mt-6">
        <SettingsField label="Store name" hint="Shown as the business name on invoices.">
          <Input
            id="settings-store-name"
            className={inputClass}
            value={form.storeName ?? ""}
            onChange={(e) => updateField("storeName", e.target.value)}
          />
        </SettingsField>
        <Separator />
        <SettingsField label="Owner name" hint="The registered owner or proprietor.">
          <Input
            id="settings-owner-name"
            className={inputClass}
            value={form.ownerName ?? ""}
            onChange={(e) => updateField("ownerName", e.target.value)}
          />
        </SettingsField>
        <Separator />
        <SettingsField label="Phone" hint="Store contact number.">
          <Input
            id="settings-phone"
            className={inputClass}
            value={form.phone ?? ""}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </SettingsField>
        <Separator />
        <SettingsField label="Email" hint="Used for receipts and communications.">
          <Input
            id="settings-email"
            type="email"
            className={inputClass}
            value={form.email ?? ""}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </SettingsField>
        <Separator />
        <SettingsField label="Address" hint="Street address shown on invoices.">
          <div className="grid gap-3">
            <Input
              id="settings-address-line1"
              className={inputClass}
              placeholder="Address Line 1"
              value={form.addressLine1 ?? ""}
              onChange={(e) => updateField("addressLine1", e.target.value)}
            />
            <Input
              id="settings-address-line2"
              className={inputClass}
              placeholder="Address Line 2 (optional)"
              value={form.addressLine2 ?? ""}
              onChange={(e) => updateField("addressLine2", e.target.value || null)}
            />
          </div>
        </SettingsField>
        <Separator />
        <SettingsField label="Location" hint="City, state, country, and pincode.">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="settings-city"
              className={inputClass}
              placeholder="City"
              value={form.city ?? ""}
              onChange={(e) => updateField("city", e.target.value)}
            />
            <Input
              id="settings-state"
              className={inputClass}
              placeholder="State"
              value={form.state ?? ""}
              onChange={(e) => updateField("state", e.target.value)}
            />
            <Input
              id="settings-country"
              className={inputClass}
              placeholder="Country"
              value={form.country ?? ""}
              onChange={(e) => updateField("country", e.target.value)}
            />
            <Input
              id="settings-pincode"
              className={inputClass}
              placeholder="Pincode"
              value={form.pincode ?? ""}
              onChange={(e) => updateField("pincode", e.target.value)}
            />
          </div>
        </SettingsField>
        <Separator />
        <SettingsField label="GSTIN" hint="GST identification number (optional).">
          <Input
            id="settings-gstin"
            className={inputClass}
            placeholder="e.g. 29ABCDE1234F1Z5"
            value={form.gstin ?? ""}
            onChange={(e) => updateField("gstin", e.target.value || null)}
          />
        </SettingsField>

        <div className="mt-6 flex justify-end">
          <Button
            id="settings-save-profile"
            className="h-11 px-6 text-base"
            onClick={handleSave}
            disabled={!isDirty || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </section>
  );
};

export const BillingSettingsPage = () => {
  const { data: preferences } = useQuery({
    queryKey: ["appPreferences"],
    queryFn: () => apiClient.get<AppPreferencesResponse>("/api/app-preferences"),
    staleTime: Infinity
  });
  const config = preferences?.config;
  const [open, setOpen] = useState(false);

  const { data: customersResponse } = useQuery({
    queryKey: ["customers", ""],
    queryFn: () =>
      apiClient.get<{ data: Customer[] }>("/api/customers", { query: "", pageSize: 100 })
  });
  const customers = customersResponse?.data;

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (defaultCustomerId: string) =>
      apiClient.patch<AppPreferencesResponse>("/api/app-preferences", {
        billing: { defaultCustomerId }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appPreferences"] });
      toast.success("Billing preferences updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update billing preferences");
    }
  });

  const handleCustomerSelect = (customerId: string) => {
    setOpen(false);
    mutation.mutate(customerId);
  };

  const selectedCustomerName = useMemo(() => {
    const defaultCustomerId = preferences?.config?.billing?.defaultCustomerId;
    if (!customers || !defaultCustomerId) return null;
    const match = customers.find((c) => c.id === defaultCustomerId);
    return match?.name ?? null;
  }, [customers, preferences?.config?.billing?.defaultCustomerId]);

  if (!config) return null;

  return (
    <section>
      <SectionHeading
        title="Billing"
        subtitle="Control default customer assignment for new transactions."
      />
      <div className="mt-6">
        <SettingsField
          label="Default customer"
          hint="Pre-select this customer when creating a new bill."
        >
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id="settings-default-customer"
                variant="outline"
                className={cn(
                  "h-11 w-full justify-between text-base font-normal",
                  !selectedCustomerName && "text-muted-foreground"
                )}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  (selectedCustomerName ?? "Select a customer")
                )}
                <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
              <Command>
                <CommandInput placeholder="Search customers…" className="h-11 text-base" />
                <CommandList>
                  <CommandEmpty className="py-4 text-center text-base">
                    No customer found.
                  </CommandEmpty>
                  <CommandGroup>
                    {customers?.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.name}
                        onSelect={() => handleCustomerSelect(customer.id)}
                        className="py-2.5 text-base"
                      >
                        <Check
                          className={cn(
                            "size-4 shrink-0",
                            config.billing.defaultCustomerId === customer.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {customer.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </SettingsField>
      </div>
    </section>
  );
};

export const ExportsSettingsPage = () => {
  const { data: preferences } = useQuery({
    queryKey: ["appPreferences"],
    queryFn: () => apiClient.get<AppPreferencesResponse>("/api/app-preferences"),
    staleTime: Infinity
  });
  const config = preferences?.config;

  const [pdfLocation, setPdfLocation] = useState(
    preferences?.config?.exports?.defaultPdfLocation ?? ""
  );
  const [isBrowsing, setIsBrowsing] = useState(false);

  useEffect(() => {
    setPdfLocation(preferences?.config?.exports?.defaultPdfLocation ?? "");
  }, [preferences?.config?.exports?.defaultPdfLocation]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (exports: Record<string, unknown>) =>
      apiClient.patch<AppPreferencesResponse>("/api/app-preferences", { exports }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appPreferences"] });
      toast.success("Export preferences updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update export preferences");
    }
  });

  const handleAskBeforeSavingToggle = (checked: boolean) => {
    mutation.mutate({ askBeforeSavingPdf: checked });
  };

  const handleBrowseFolder = async () => {
    setIsBrowsing(true);
    try {
      const folderPath = await window.dialogApi.selectFolder();
      if (folderPath) {
        setPdfLocation(folderPath);
        mutation.mutate({ defaultPdfLocation: folderPath });
      }
    } catch {
      toast.error("Failed to open folder picker");
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleExportFormatChange = (format: string) => {
    mutation.mutate({ defaultExportFormat: format });
  };

  if (!config) return null;

  return (
    <section>
      <SectionHeading
        title="Exports & Storage"
        subtitle="Define how and where output files are saved during billing and exports."
      />
      <div className="mt-6">
        <SettingsField
          label="Ask before saving PDF"
          hint="When enabled, you'll be prompted for a save location every time. When disabled, PDFs save to the default location automatically."
        >
          <div className="flex h-11 items-center justify-end">
            <Switch
              id="settings-ask-before-saving"
              checked={config.exports.askBeforeSavingPdf}
              onCheckedChange={handleAskBeforeSavingToggle}
              disabled={mutation.isPending}
            />
          </div>
        </SettingsField>
        <Separator />
        <SettingsField
          label="Default PDF save location"
          hint="Invoices and receipts will save here when the prompt is disabled."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="settings-pdf-location"
              className={cn(inputClass, "text-muted-foreground cursor-default")}
              value={pdfLocation || "No folder selected"}
              readOnly
              tabIndex={-1}
            />
            <Button
              id="settings-browse-folder"
              variant="outline"
              className="h-11 shrink-0 px-5 text-base"
              onClick={handleBrowseFolder}
              disabled={isBrowsing || mutation.isPending}
            >
              {isBrowsing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FolderOpen className="size-4" />
              )}
              {isBrowsing ? "Opening…" : "Browse"}
            </Button>
          </div>
          {mutation.isPending && (
            <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
              <Loader2 className="size-3.5 animate-spin" />
              Saving path…
            </p>
          )}
        </SettingsField>
        <Separator />
        <SettingsField
          label="Default export format"
          hint="Used when no format is explicitly selected during export."
        >
          <Select
            value={config.exports.defaultExportFormat}
            onValueChange={handleExportFormatChange}
            disabled={mutation.isPending}
          >
            <SelectTrigger id="settings-export-format" className={selectTriggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf" className="py-2.5 text-base">
                PDF
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
      </div>
    </section>
  );
};
