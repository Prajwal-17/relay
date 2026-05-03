import { cn } from "@/lib/utils";
import type { BillingTabType } from "@/store/billingTabsStore";
import { TRANSACTION_TYPE } from "@shared/types";
import { X } from "lucide-react";
import { motion } from "motion/react";

const getTabLabel = (tab: BillingTabType): string => {
  if (tab.transactionNo) {
    return tab.type === TRANSACTION_TYPE.SALE
      ? `Sale #${tab.transactionNo}`
      : `Estimate #${tab.transactionNo}`;
  }
  return tab.type === TRANSACTION_TYPE.SALE ? "New Sale" : "New Estimate";
};

export const BillingTab = ({
  tab,
  isActive,
  onSelect,
  onClose
}: {
  tab: BillingTabType;
  isActive: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
}) => {
  const isSale = tab.type === TRANSACTION_TYPE.SALE;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.92, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: 0.9,
        width: 0,
        marginRight: 0,
        paddingLeft: 0,
        paddingRight: 0
      }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      onClick={onSelect}
      className={cn(
        "group relative flex cursor-pointer items-center gap-2.5 rounded-t-lg border-none px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150",
        isActive
          ? "bg-background-secondary text-foreground z-10 -mb-px"
          : "text-foreground/50 hover:bg-foreground/4 hover:text-foreground/70"
      )}
    >
      <span
        className={cn("h-3 w-3 shrink-0 rounded-full", isSale ? "bg-success" : "bg-blue-500")}
      />

      <span className="max-w-34 truncate text-lg font-medium">{getTabLabel(tab)}</span>

      <motion.span
        role="button"
        tabIndex={-1}
        onClick={onClose}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-opacity duration-100",
          isActive
            ? "hover:bg-foreground/10 hover:opacity-100!"
            : "hover:bg-foreground/10 hover:opacity-100!"
        )}
      >
        <X size={20} />
      </motion.span>

      {isActive && (
        <motion.div
          layoutId="activeTabAccent"
          className={cn(
            "absolute right-3 bottom-0 left-3 h-[2.5px] rounded-t-full",
            isSale ? "bg-success" : "bg-blue-400"
          )}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        />
      )}
    </motion.button>
  );
};
