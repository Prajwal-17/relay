import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import type { Customer } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SettingsField } from "../SettingsField";
import { SettingsSection } from "../SettingsSection";
import { useAppPreferences } from "../../../hooks/useAppPreferences";

const DESCRIPTION = "Settings for new bills.";

const SCALE_MIN = 80;
const SCALE_MAX = 150;
const SCALE_STEP = 5;

const SearchDropdownSizeField = () => {
  const { config, updateConfig, isUpdating } = useAppPreferences();
  const scale = config?.billing?.searchDropdown?.scale ?? 1;
  const [localPercent, setLocalPercent] = useState<number>(() => Math.round(scale * 100));

  useEffect(() => {
    setLocalPercent(Math.round(scale * 100));
  }, [scale]);

  return (
    <SettingsField
      label="Search dropdown size"
      hint="Enlarge or shrink the product search popup in bills."
      defaultValue="100%"
      onReset={() => {
        setLocalPercent(100);
        updateConfig({ billing: { searchDropdown: { scale: 1 } } });
      }}
      isResetting={isUpdating}
    >
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground w-12 text-right text-sm tabular-nums">
          {SCALE_MIN}%
        </span>
        <Slider
          value={[localPercent]}
          min={SCALE_MIN}
          max={SCALE_MAX}
          step={SCALE_STEP}
          onValueChange={(v) => setLocalPercent(v[0]!)}
          onValueCommit={(v) =>
            updateConfig({ billing: { searchDropdown: { scale: v[0]! / 100 } } })
          }
          className="flex-1"
        />
        <span className="text-muted-foreground w-12 text-sm tabular-nums">{SCALE_MAX}%</span>
      </div>
      <div className="mt-1 text-center">
        <span className="text-foreground text-base font-semibold tabular-nums">
          {localPercent}%
        </span>
      </div>
    </SettingsField>
  );
};

export const BillingSection = () => {
  const { config, isLoading, updateConfig, isUpdating } = useAppPreferences();
  const [open, setOpen] = useState(false);

  const { data: customersResponse } = useQuery({
    queryKey: ["customers", ""],
    queryFn: () =>
      apiClient.get<{ data: Customer[] }>("/api/customers", { query: "", pageSize: 100 })
  });
  const customers = customersResponse?.data;

  const selectedCustomerName = useMemo(() => {
    const defaultCustomerId = config?.billing?.defaultCustomerId;
    if (!customers || !defaultCustomerId) return null;
    const match = customers.find((c) => c.id === defaultCustomerId);
    return match?.name ?? null;
  }, [customers, config?.billing?.defaultCustomerId]);

  const handleCustomerSelect = (customerId: string) => {
    setOpen(false);
    updateConfig({ billing: { defaultCustomerId: customerId } });
  };

  if (isLoading || !config) {
    return (
      <SettingsSection title="Billing" description={DESCRIPTION}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title="Billing" description={DESCRIPTION}>
      <SettingsField label="Default customer" hint="Used for every new bill.">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="settings-default-customer"
              variant="outline"
              className={cn(
                "h-11 w-full justify-between text-base font-normal",
                !selectedCustomerName && "text-muted-foreground"
              )}
              disabled={isUpdating}
            >
              {isUpdating ? (
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

      <SearchDropdownSizeField />
    </SettingsSection>
  );
};
