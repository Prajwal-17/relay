import { Input } from "@/components/ui/input";
import { useBillingStore } from "@/store/billingStore";
import type { Customer } from "@shared/types";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export const CustomerNameInput = () => {
  const customerId = useBillingStore((state) => state.customerId);
  const setCustomerId = useBillingStore((state) => state.setCustomerId);
  const customerName = useBillingStore((state) => state.customerName);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);
  const setCustomerContact = useBillingStore((state) => state.setCustomerContact);
  const isNewCustomer = useBillingStore((state) => state.isNewCustomer);
  const setIsNewCustomer = useBillingStore((state) => state.setIsNewCustomer);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);

  const inputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function searchCustomers() {
      try {
        const response = await fetch(`http://localhost:3000/api/customers?query${customerName}`, {
          method: "GET"
        });
        const data = await response.json();
        if (data.status === "success") {
          setCustomers(data.data);
        } else {
          console.log("error");
        }
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong");
      }
    }

    searchCustomers();
  }, [customerName]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event?.target as Node)) {
        setOpenDropdown(false);
      }
    };

    if (openDropdown) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown, setOpenDropdown]);

  return (
    <div className="flex w-full flex-col gap-1">
      <div ref={inputRef} className="relative w-full">
        <label htmlFor="customer-name" className="text-foreground text-lg font-medium">
          Customer Name
        </label>
        <Input
          placeholder="Enter Name"
          id="customer-name"
          value={customerName}
          className="mt-1 px-4 py-6 text-lg! font-medium focus:border-none"
          onClick={() => setOpenDropdown((prev) => !prev)}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        {openDropdown && (
          <div className="bg-muted border-border absolute top-full z-20 mt-2 h-full min-h-72 w-full space-y-1 overflow-y-auto rounded-xl border px-2 py-1 shadow-xl">
            {customers.map((c, idx) => (
              <div
                className="hover:bg-secondary rounded-lg px-3 py-2 text-lg font-medium hover:cursor-pointer"
                key={idx}
                onClick={() => {
                  setCustomerId(c.id);
                  setCustomerName(c.name);
                  setCustomerContact(c.contact);
                  setIsNewCustomer(false);
                  setOpenDropdown((prev) => !prev);
                }}
              >
                {c.name}
              </div>
            ))}
          </div>
        )}
      </div>
      <span className="bg-success text-success-foreground self-start rounded-md px-2 font-medium">
        {(!customerId || customerName === "") && "New Customer"}
      </span>
    </div>
  );
};
