import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBillingSessionStore } from "@/features/billing/store/billingSession.store";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import { type PreviewTab, usePreviewTabStore } from "@/features/billing/store/previewTab.store";
import { PanelRightClose } from "lucide-react";
import { useEffect } from "react";
import { BillPreview } from "./BillPreview";
import { CustomerAccountTab } from "./CustomerAccountTab";

const BillingPreviewPanel = () => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const session = useBillingSessionStore((state) =>
    activeTabId ? state.sessions[activeTabId] : null
  );
  const activePreviewTab = usePreviewTabStore((state) =>
    activeTabId ? (state.tabs[activeTabId] ?? "bill") : "bill"
  );
  const isPanelOpen = usePreviewTabStore((state) => state.isPanelOpen);
  const setPanelOpen = usePreviewTabStore((state) => state.setPanelOpen);
  const setActivePreviewTab = usePreviewTabStore((state) => state.setActiveTab);

  useEffect(() => {
    if (!activeTabId) return;
    if (!usePreviewTabStore.getState().tabs[activeTabId]) {
      setActivePreviewTab(activeTabId, "bill");
    }
  }, [activeTabId, setActivePreviewTab]);

  if (!activeTabId || !session || !isPanelOpen) return null;

  const handleValueChange = (value: string) => {
    if (value === "bill" || value === "customer") {
      setActivePreviewTab(activeTabId, value as PreviewTab);
    }
  };

  return (
    <aside className="border-l-frame bg-card fixed inset-y-0 right-0 z-40 flex w-[min(24rem,calc(100vw-1rem))] min-w-0 shrink-0 flex-col border-l shadow-lg min-[1280px]:static min-[1280px]:z-auto min-[1280px]:w-[clamp(18rem,27vw,24rem)] min-[1280px]:shadow-none">
      <Tabs
        value={activePreviewTab}
        onValueChange={handleValueChange}
        className="flex h-full min-h-0 flex-1 flex-col gap-0"
      >
        <div className="flex h-10 shrink-0 items-center gap-1 border-b px-2">
          <TabsList className="grid h-8 min-w-0 flex-1 grid-cols-2">
            <TabsTrigger value="bill" className="cursor-pointer">
              Preview
            </TabsTrigger>
            <TabsTrigger value="customer" className="cursor-pointer">
              Customer
            </TabsTrigger>
          </TabsList>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setPanelOpen(false)}
            aria-label="Close preview panel"
          >
            <PanelRightClose />
          </Button>
        </div>

        <TabsContent value="bill" className="bg-muted min-h-0 flex-1 overflow-y-auto">
          <BillPreview />
        </TabsContent>

        <TabsContent value="customer" className="min-h-0 flex-1 overflow-y-auto">
          <CustomerAccountTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
};

export default BillingPreviewPanel;
