import { Input } from "@/components/ui/input";
import useTransactionState from "@/hooks/useTransactionState";
import type { CustomersType } from "@shared/types";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export const CustomerNameInput = () => {
  const { setCustomerId, customerName, setCustomerName, setCustomerContact, setIsNewCustomer } =
    useTransactionState();
  const [customers, setCustomers] = useState<CustomersType[]>([]);
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);

  const inputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function searchCustomers() {
      try {
        const response = await window.customersApi.searchCustomers(customerName);
        if (response.status === "success") {
          setCustomers(response.data);
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

  useEffect(() => {
    let isCurrent = true;
    async function getCustomerByName() {
      try {
        if (customerName === "") {
          setIsNewCustomer(false);
          setCustomerId(null);
          setCustomerContact(null);
          return;
        }
        const response = await window.customersApi.getCustomerByName(customerName);
        if (isCurrent) {
          if (response.status === "success") {
            if (response.data === null) {
              setIsNewCustomer(true);
              setCustomerId(null);
              setCustomerContact(null);
            } else {
              setIsNewCustomer(false);
              setCustomerId(response.data.id);
              setCustomerContact(response.data.contact);
            }
          } else {
            console.log("error");
            toast.error("Something went wrong while fetching customer");
          }
        }
      } catch (error) {
        console.log(error);
        toast.error("Something went wrong");
      }
    }

    getCustomerByName();
    return () => {
      isCurrent = false;
    };
  }, [customerName, setCustomerId, setCustomerContact, setIsNewCustomer]);

  return (
    <>
      <div ref={inputRef} className="relative w-full">
        <label htmlFor="customer-name" className="text-foreground text-lg font-medium">
          Customer Name
        </label>
        <Input
          placeholder="Enter Name"
          id="customer-name"
          value={customerName}
          className="px-4 py-6 !text-lg font-medium focus:border-none"
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
                  setOpenDropdown((prev) => !prev);
                }}
              >
                {c.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
