import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MAX_BILLING_TABS,
  useBillingTabsStore,
  type BillingTabType
} from "@/store/billingTabsStore";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { BillingSaveStatus } from "../BillingSaveStatus";
import { BillingTab } from "./BillingTab";

const BillingTabBar = () => {
  const navigate = useNavigate();

  const tabs = useBillingTabsStore((s) => s.tabs);
  const activeTabId = useBillingTabsStore((s) => s.activeTabId);
  const setActiveTab = useBillingTabsStore((s) => s.setActiveTab);
  const addTab = useBillingTabsStore((s) => s.addTab);
  const removeTab = useBillingTabsStore((s) => s.removeTab);

  const handleTabClick = (tab: BillingTabType) => {
    if (tab.id === activeTabId) return;
    setActiveTab(tab.id);
    navigate(tab.routePath);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const newActiveId = removeTab(tabId);
    if (newActiveId) {
      const next = useBillingTabsStore.getState().tabs.find((t) => t.id === newActiveId);
      if (next) navigate(next.routePath);
    } else {
      navigate("/");
    }
  };

  const handleNewTab = (type: TransactionType) => {
    const routePath =
      type === TRANSACTION_TYPE.SALE ? "/billing/sales/create" : "/billing/estimates/create";
    const tab = addTab(type, routePath, null, false);
    if (tab) {
      navigate(routePath);
    }
  };

  const handleClosePage = () => {
    useBillingTabsStore.getState().reset();
    navigate("/");
  };

  const salesCount = tabs.filter((t) => t.type === TRANSACTION_TYPE.SALE).length;
  const estimatesCount = tabs.filter((t) => t.type === TRANSACTION_TYPE.ESTIMATE).length;
  const showDivider = salesCount > 0 && estimatesCount > 0;
  const isAtLimit = tabs.length >= MAX_BILLING_TABS;

  return (
    <div className="border-border/60 bg-card flex shrink-0 items-end justify-between border-b px-4 pt-2 select-none">
      <div className="flex flex-1 items-end gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {tabs.map((tab, index) => (
            <Fragment key={tab.id}>
              {showDivider && index === salesCount && (
                <div className="bg-border mx-2 h-6 w-px shrink-0 self-center" />
              )}
              <BillingTab
                tab={tab}
                isActive={tab.id === activeTabId}
                onSelect={() => handleTabClick(tab)}
                onClose={(e) => handleCloseTab(e, tab.id)}
              />
            </Fragment>
          ))}
        </AnimatePresence>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  disabled={isAtLimit}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent/60 ml-1.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center self-center rounded-lg border-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </motion.button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isAtLimit ? "Max tabs reached" : "New tab"}
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="start" sideOffset={8} className="min-w-42.5">
            <DropdownMenuItem
              className="cursor-pointer gap-3 py-2.5 text-lg! font-semibold"
              onClick={() => handleNewTab(TRANSACTION_TYPE.SALE)}
            >
              <span className="bg-success h-2.5 w-2.5 rounded-full" />
              New Sale
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-3 py-2.5 text-lg! font-semibold"
              onClick={() => handleNewTab(TRANSACTION_TYPE.ESTIMATE)}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              New Estimate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex shrink-0 items-center gap-3 self-center">
        <BillingSaveStatus />

        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClosePage}
              className="text-muted-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-none transition-colors duration-150 hover:bg-red-500/10 hover:text-red-500"
            >
              <X size={23} />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close billing</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default BillingTabBar;
