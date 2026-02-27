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
import { useBillingStore } from "@/store/billingStore";
import type { Customer } from "@shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const CustomerNameInput = () => {
  const customerId = useBillingStore((state) => state.customerId);
  const setCustomerId = useBillingStore((state) => state.setCustomerId);
  const customerName = useBillingStore((state) => state.customerName);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);

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
      setCustomerId(data.id);
      setCustomerName(data.name);
      setOpen(false);
      toast.success(`Created and selected customer: ${data.name}`);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast.error(error.message || "Error creating customer");
    }
  });

  const handleSelectCustomer = (customer: Customer) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setOpen(false);
  };

  const handleCreateCustomer = () => {
    if (!query) return;
    createCustomerMutation.mutate(query);
  };

  return (
    <div className="flex w-full flex-col items-start justify-start space-y-2">
      <p className="text-foreground text-lg font-medium">Customer Name</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full max-w-sm justify-between py-5 text-lg font-normal"
          >
            {customerName ? customerName : "Select Customer..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-40 w-[380px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search customer..."
              className="text-lg"
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
                      className="text-lg"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
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
                <div className="mt-2 border-t p-2 pt-2">
                  <Button
                    onClick={handleCreateCustomer}
                    disabled={createCustomerMutation.isPending}
                    className="w-full justify-center text-lg font-medium"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    {createCustomerMutation.isPending ? "Creating..." : `Create "${query}"`}
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
