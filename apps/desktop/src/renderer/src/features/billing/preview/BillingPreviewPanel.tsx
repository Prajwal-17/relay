import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBillingSessionStore } from "@/store/billing/billingSessionStore";
import { useBillingTabsStore } from "@/store/billing/billingTabsStore";
import { type PreviewTab, usePreviewTabStore } from "@/store/billing/previewTabStore";
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
  const setActivePreviewTab = usePreviewTabStore((state) => state.setActiveTab);

  // ensure every billing tab has an entry (defaults to "bill")
  useEffect(() => {
    if (!activeTabId) return;
    if (!usePreviewTabStore.getState().tabs[activeTabId]) {
      setActivePreviewTab(activeTabId, "bill");
    }
  }, [activeTabId, setActivePreviewTab]);

  if (!activeTabId || !session) return null;

  const handleValueChange = (value: string) => {
    if (activeTabId && (value === "bill" || value === "customer")) {
      setActivePreviewTab(activeTabId, value as PreviewTab);
    }
  };

  return (
    <div className="flex w-1/4 min-w-0 flex-col">
      <Tabs
        value={activePreviewTab}
        onValueChange={handleValueChange}
        className="flex h-full min-h-0 flex-1 flex-col gap-0"
      >
        <div className="bg-card border-border/60 mx-2 mt-2 shrink-0 rounded-xl border p-1 shadow-sm">
          <TabsList className="grid h-11 w-full grid-cols-2">
            <TabsTrigger value="bill" className="cursor-pointer text-base font-semibold">
              Preview
            </TabsTrigger>
            <TabsTrigger value="customer" className="cursor-pointer text-base font-semibold">
              Customer
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="bill"
          className="border-success bg-muted min-h-0 flex-1 overflow-y-auto border"
        >
          <BillPreview />
        </TabsContent>

        <TabsContent value="customer" className="min-h-0 flex-1 overflow-y-auto">
          <CustomerAccountTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingPreviewPanel;
