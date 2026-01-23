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
import { useBillingStore } from "@/store/billingStore";
import type { Customer } from "@shared/types";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const CustomerNameInput = () => {
  const customerId = useBillingStore((state) => state.customerId);
  const setCustomerId = useBillingStore((state) => state.setCustomerId);
  const customerName = useBillingStore((state) => state.customerName);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);
  const setIsNewCustomer = useBillingStore((state) => state.setIsNewCustomer);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchCustomers = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/customers?query=${debouncedQuery}`,
          {
            method: "GET"
          }
        );
        const data = await response.json();
        if (data.status === "success") {
          setCustomers(data.data);
        } else {
          setCustomers([]);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
        toast.error("Failed to load customers");
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    searchCustomers();
  }, [debouncedQuery]);

  const handleSelectCustomer = (customer: Customer) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setIsNewCustomer(false);
    setOpen(false);
  };

  const handleCreateCustomer = async () => {
    if (!query) return;
    try {
      const response = await fetch("http://localhost:3000/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: query, contact: null, customerType: "cash" })
      });
      const data = await response.json();

      if (data.status === "success" && data.data) {
        setCustomerId(data.data.id);
        setCustomerName(data.data.name);
        setIsNewCustomer(false);
        setOpen(false);
        toast.success(`Created and selected customer: ${data.data.name}`);
      } else {
        toast.error("Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Error creating customer");
    }
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
              {loading && (
                <div className="text-muted-foreground p-4 text-center text-sm">Loading...</div>
              )}

              {!loading && customers.length > 0 && (
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

              {!loading && query && (
                <div className="mt-2 border-t p-2 pt-2">
                  <Button
                    onClick={handleCreateCustomer}
                    className="w-full justify-center text-lg font-medium"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create &quot;{query}&quot;
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
