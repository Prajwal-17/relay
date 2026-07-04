import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import useDebounce from "@/hooks/useDebounce";
import { apiClient } from "@/lib/apiClient";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { processSyncQueue } from "@/utils/syncWorker";
import type { Customer } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const CustomerNameInput = () => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const updateField = useBillingSessionStore((state) => state.updateField);
  const customerId = session?.customerId ?? null;
  const customerName = session?.customerName ?? "";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const queryClient = useQueryClient();

  const {
    data: customers = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["customers", debouncedQuery],
    queryFn: () =>
      apiClient.get<Customer[]>("/api/customers", {
        query: debouncedQuery
      })
  });

  useEffect(() => {
    if (isError && error) {
      toast.error("Failed to load customers");
    }
  }, [isError, error]);

  const createCustomerMutation = useMutation<Customer, Error, string>({
    mutationFn: (name: string) =>
      apiClient.post<Customer>("/api/customers", {
        name,
        contact: null,
        customerType: "cash"
      }),
    onSuccess: (data) => {
      updateField(activeTabId, "customerId", data.id);
      updateField(activeTabId, "customerName", data.name);
      setOpen(false);
      if (activeTabId) processSyncQueue(activeTabId);
      toast.success(`Created and selected customer: ${data.name}`);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast.error(error.message || "Error creating customer");
    }
  });

  const handleSelectCustomer = (customer: Customer) => {
    updateField(activeTabId, "customerId", customer.id);
    updateField(activeTabId, "customerName", customer.name);
    setOpen(false);
    if (activeTabId) processSyncQueue(activeTabId);
  };

  const handleCreateCustomer = () => {
    if (!query) return;
    createCustomerMutation.mutate(query);
  };

  if (!activeTabId || !session) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="border-border/60 hover:bg-accent/50 h-10 w-96 justify-between bg-transparent px-4 text-base font-normal"
        >
          <span className="truncate">{customerName ? customerName : "Select Customer..."}</span>
          <ChevronsUpDown className="ml-3 h-5 w-5 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-40 w-96 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search customer..."
            className="py-2.5 text-base"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading && (
              <div className="text-muted-foreground p-4 text-center text-sm">Loading...</div>
            )}

            {!isLoading && customers.length > 0 && (
              <CommandGroup heading="Existing Customers">
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => handleSelectCustomer(customer)}
                    className="py-2.5 text-base"
                  >
                    <Check
                      className={`mr-3 h-4 w-4 ${
                        customerId === customer.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span>{customer.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!isLoading && query && (
              <div className="mt-1 border-t p-2 pt-2">
                <Button
                  onClick={handleCreateCustomer}
                  disabled={createCustomerMutation.isPending}
                  className="w-full justify-center py-5 text-base font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createCustomerMutation.isPending ? "Creating..." : `Create "${query}"`}
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
