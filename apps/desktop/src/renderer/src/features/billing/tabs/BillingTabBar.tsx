import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { billingCoordinator } from "@/store/billing/billingCoordinator";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import {
  MAX_BILLING_TABS,
  useBillingTabsStore,
  type BillingTabType
} from "@/store/billing/billingTabsStore";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BillingSaveStatus } from "../BillingSaveStatus";
import { BillingTab } from "./BillingTab";

const BillingTabBar = () => {
  const navigate = useNavigate();

  const tabs = useBillingTabsStore((s) => s.tabs);
  const activeTabId = useBillingTabsStore((s) => s.activeTabId);
  const setActiveTab = useBillingTabsStore((s) => s.setActiveTab);

  const handleTabClick = (tab: BillingTabType) => {
    if (tab.id === activeTabId) return;
    setActiveTab(tab.id);
    navigate(tab.routePath);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const newActiveId = billingCoordinator.removeTab(tabId);
    if (newActiveId) {
      const next = useBillingTabsStore.getState().tabs.find((t) => t.id === newActiveId);
      if (next) navigate(next.routePath);
    } else {
      navigate("/");
    }
  };

  const handleNewTab = async (type: TransactionType) => {
    const routePath =
      type === TRANSACTION_TYPE.SALE ? "/billing/sales/create" : "/billing/estimates/create";

    const tab = billingCoordinator.addTab(type, routePath, null);
    if (tab) {
      setActiveTab(tab.id);
      navigate(routePath);
    }
  };

  const handleClosePage = () => {
    useBillingTabsStore.getState().reset();
    useBillingSessionStore.setState({ sessions: {} });
    navigate("/");
  };

  const salesCount = tabs.filter((t) => t.type === TRANSACTION_TYPE.SALE).length;
  const estimatesCount = tabs.filter((t) => t.type === TRANSACTION_TYPE.ESTIMATE).length;
  const showDivider = salesCount > 0 && estimatesCount > 0;
  const isAtLimit = tabs.length >= MAX_BILLING_TABS;

  return (
    <div className="border-b-frame bg-card flex h-10 shrink-0 items-end justify-between border-b px-2 select-none">
      <div className="flex flex-1 [scrollbar-width:none] items-end gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab, index) => (
          <div key={tab.id} className="flex items-end gap-0.5">
            {showDivider && index === salesCount && (
              <div className="bg-border mx-2 h-6 w-px shrink-0 self-center" />
            )}
            <BillingTab
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={() => handleTabClick(tab)}
              onClose={(e) => handleCloseTab(e, tab.id)}
            />
          </div>
        ))}

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isAtLimit}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted ml-1 flex size-7 shrink-0 cursor-pointer items-center justify-center self-center rounded-(--radius-control) transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isAtLimit ? "Max tabs reached" : "New tab"}
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent align="start" sideOffset={8} className="min-w-42.5">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => void handleNewTab(TRANSACTION_TYPE.SALE)}
            >
              <span className="bg-success h-2.5 w-2.5 rounded-full" />
              New Sale
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => void handleNewTab(TRANSACTION_TYPE.ESTIMATE)}
            >
              <span className="bg-info h-2.5 w-2.5 rounded-full" />
              New Estimate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-center">
        <BillingSaveStatus />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleClosePage}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex size-7 cursor-pointer items-center justify-center rounded-(--radius-control) transition-colors"
            >
              <X size={23} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close billing</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default BillingTabBar;
