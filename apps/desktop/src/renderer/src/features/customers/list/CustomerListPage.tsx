import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Download, Filter, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { mockCustomers } from "../_mock/data";
import { CustomerListTable } from "./CustomerListTable";

/**
 * Level 1 — minimal dummy list (plan §1). No virtualization, sort, or real
 * filters. Search is local-only over the mock array.
 */
export function CustomerListPage({
  onSelect,
  onNewCustomer
}: {
  onSelect: (id: string) => void;
  onNewCustomer: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mockCustomers;
    return mockCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.contact ?? "").toLowerCase().includes(q) ||
        (c.gstin ?? "").toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      {/* Sticky header */}
      <div className="bg-card border-border flex shrink-0 flex-col gap-3 rounded-xl border px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-foreground text-xl font-semibold tracking-[-0.02em]">
              All Customers
            </h1>
            <span className="text-muted-foreground text-sm font-medium tabular-nums">
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 cursor-pointer" disabled>
              <Filter className="size-4" />
              Filters
            </Button>
            <Button variant="outline" className="h-9 cursor-pointer" disabled>
              <Download className="size-4" />
              Export
            </Button>
            <Button className="hover:bg-primary-hover h-9 cursor-pointer" onClick={onNewCustomer}>
              <Plus className="size-4" />
              New Customer
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, contact, or GSTIN…"
            className={cn("h-9 pl-9")}
          />
        </div>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        {filtered.length > 0 ? (
          <CustomerListTable customers={filtered} onSelect={onSelect} />
        ) : (
          <div className="bg-card border-border flex h-full min-h-64 flex-col items-center justify-center rounded-xl border px-6 py-16 text-center shadow-xs">
            <span className="bg-muted text-muted-foreground mb-5 flex size-12 items-center justify-center rounded-xl">
              <Users className="size-6" />
            </span>
            <h3 className="text-foreground text-base font-semibold tracking-[-0.02em]">
              No customers found
            </h3>
            <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
              {search
                ? "No matches for your search. Try a different query."
                : "Get started by adding your first customer."}
            </p>
            <Button
              className="hover:bg-primary-hover mt-5 h-9 cursor-pointer"
              onClick={onNewCustomer}
            >
              <Plus className="size-4" />
              New Customer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
