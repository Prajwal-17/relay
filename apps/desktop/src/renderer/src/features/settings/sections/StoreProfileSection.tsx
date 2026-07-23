import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import type { StoreProfile } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { SettingsField } from "../SettingsField";
import { SettingsSection } from "../SettingsSection";

const inputClass = "text-sm font-medium";

const DESCRIPTION = "Details about your shop.";

export const StoreProfileSection = () => {
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
      <SettingsSection title="Store Profile" description={DESCRIPTION}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title="Store Profile" description={DESCRIPTION}>
      <SettingsField label="Store name" hint="Shown on your bills.">
        <Input
          id="settings-store-name"
          className={inputClass}
          value={form.storeName ?? ""}
          onChange={(e) => updateField("storeName", e.target.value)}
        />
      </SettingsField>
      <SettingsField label="Owner name" hint="Who owns the shop.">
        <Input
          id="settings-owner-name"
          className={inputClass}
          value={form.ownerName ?? ""}
          onChange={(e) => updateField("ownerName", e.target.value)}
        />
      </SettingsField>
      <SettingsField label="Phone" hint="Your phone number.">
        <Input
          id="settings-phone"
          className={inputClass}
          value={form.phone ?? ""}
          onChange={(e) => updateField("phone", e.target.value)}
        />
      </SettingsField>
      <SettingsField label="Email" hint="Your Email.">
        <Input
          id="settings-email"
          type="email"
          className={inputClass}
          value={form.email ?? ""}
          onChange={(e) => updateField("email", e.target.value)}
        />
      </SettingsField>
      <SettingsField label="Address" hint="Shown on your bills.">
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
      <SettingsField label="Location" hint="Your city, state, and pincode.">
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
      <SettingsField label="GSTIN" hint="Optional.">
        <Input
          id="settings-gstin"
          className={inputClass}
          placeholder="e.g. 29ABCDE1234F1Z5"
          value={form.gstin ?? ""}
          onChange={(e) => updateField("gstin", e.target.value || null)}
        />
      </SettingsField>
      <div className="flex justify-end py-3">
        <Button
          id="settings-save-profile"
          className="px-4 text-sm"
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
    </SettingsSection>
  );
};
