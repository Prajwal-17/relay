import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBillingPersistenceGuard } from "@/features/billing/BillingPersistenceContext";
import { billingCoordinator } from "@/features/billing/store/billingCoordinator";
import {
  MAX_BILLING_TABS,
  useBillingTabsStore,
  type BillingTabType
} from "@/features/billing/store/billingTabs.store";
import { useReferenceWindowStore } from "@/features/billing/store/referenceWindow.store";
import { billingSyncCoordinator } from "@/features/billing/syncWorker";
import { TRANSACTION_TYPE, type TransactionType } from "@shared/types";
import { ImageIcon, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BillingSaveStatus } from "../BillingSaveStatus";
import { BillingTab } from "./BillingTab";

const BillingTabBar = () => {
  const navigate = useNavigate();
  const { protect } = useBillingPersistenceGuard();
  const tabs = useBillingTabsStore((state) => state.tabs);
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const setActiveTab = useBillingTabsStore((state) => state.setActiveTab);
  const isReferenceOpen = useReferenceWindowStore((state) => state.isOpen);
  const toggleReferenceWindow = useReferenceWindowStore((state) => state.toggle);

  const handleTabClick = (tab: BillingTabType) => {
    if (tab.id === activeTabId) return;
    setActiveTab(tab.id);
    navigate(tab.routePath);
  };

  const removeTabAndNavigate = (tabId: string, discard = false) => {
    const newActiveId = billingCoordinator.removeTab(tabId, { discard });
    if (newActiveId) {
      const next = useBillingTabsStore.getState().tabs.find((tab) => tab.id === newActiveId);
      if (next) navigate(next.routePath);
    } else {
      navigate("/");
    }
  };

  const handleCloseTab = (event: React.MouseEvent, tabId: string) => {
    event.stopPropagation();
    void protect({
      save: () => billingSyncCoordinator.flush(tabId),
      afterSave: () => removeTabAndNavigate(tabId),
      afterDiscard: () => removeTabAndNavigate(tabId, true),
      origin: event.currentTarget as HTMLElement
    });
  };

  const handleNewTab = (type: TransactionType) => {
    const routePath =
      type === TRANSACTION_TYPE.SALE ? "/billing/sales/create" : "/billing/estimates/create";
    const tab = billingCoordinator.addTab(type, routePath, null);
    if (tab) {
      setActiveTab(tab.id);
      navigate(routePath);
    }
  };

  const handleClosePage = (event: React.MouseEvent<HTMLButtonElement>) => {
    void protect({
      save: () => billingSyncCoordinator.flushAll(),
      afterSave: () => {
        billingCoordinator.removeAllTabs();
        navigate("/");
      },
      afterDiscard: () => {
        billingCoordinator.removeAllTabs({ discard: true });
        navigate("/");
      },
      origin: event.currentTarget
    });
  };

  const salesCount = tabs.filter((tab) => tab.type === TRANSACTION_TYPE.SALE).length;
  const estimatesCount = tabs.filter((tab) => tab.type === TRANSACTION_TYPE.ESTIMATE).length;
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
              onClose={(event) => handleCloseTab(event, tab.id)}
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
                  aria-label="New billing tab"
                  className="text-muted-foreground hover:text-foreground hover:bg-hover ml-1 flex size-7 shrink-0 cursor-pointer items-center justify-center self-center rounded-(--radius-control) transition-colors disabled:cursor-not-allowed disabled:opacity-30"
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
              onClick={() => handleNewTab(TRANSACTION_TYPE.SALE)}
            >
              <span className="bg-sales h-2.5 w-2.5 rounded-full" />
              New Sale
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => handleNewTab(TRANSACTION_TYPE.ESTIMATE)}
            >
              <span className="bg-estimate h-2.5 w-2.5 rounded-full" />
              New Estimate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isReferenceOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleReferenceWindow}
              className="h-7 gap-1.5 px-2 text-xs"
              aria-label={isReferenceOpen ? "Close item list" : "Open item list"}
              aria-pressed={isReferenceOpen}
            >
              <ImageIcon />
              <span className="hidden min-[1120px]:inline">Item list</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isReferenceOpen ? "Close item list" : "Open item list"}
          </TooltipContent>
        </Tooltip>

        <BillingSaveStatus />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Close billing workspace"
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
