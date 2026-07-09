import { motion } from "motion/react";
import type { CustomerMock } from "../_mock/types";
import { CustomerListRow } from "./CustomerListRow";

const gridTemplate = "grid-cols-12";

export function CustomerListTable({
  customers
}: {
  customers: CustomerMock[];
}) {
  return (
    <div className="bg-card border-border flex flex-col overflow-hidden rounded-xl border shadow-xs">
      <div
        className={`bg-muted text-muted-foreground ${gridTemplate} grid gap-2 px-4 py-2 text-xs font-semibold tracking-wide uppercase`}
      >
        <div className="col-span-4">Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3">Outstanding</div>
        <div className="col-span-2 text-right">Total Sales</div>
        <div className="col-span-1 text-right">Last</div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.02 } }
        }}
      >
        {customers.map((customer) => (
          <motion.div
            key={customer.id}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.12, ease: "easeOut" } }
            }}
          >
            <CustomerListRow customer={customer} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
