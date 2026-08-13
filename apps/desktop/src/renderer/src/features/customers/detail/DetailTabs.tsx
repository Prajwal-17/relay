import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CUSTOMER_DETAIL_TAB, type CustomerDetailTab } from "@/types/renderer.types";
import type { Customer } from "@shared/types";
import { AboutTab } from "./tabs/AboutTab";
import { AccountingTab } from "./tabs/AccountingTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { EstimatesTab } from "./tabs/EstimatesTab";
import { OverviewTab } from "./tabs/OverviewTab";
import { SalesTab } from "./tabs/SalesTab";
import { SettingsTab } from "./tabs/SettingsTab";

export type TabValue = CustomerDetailTab;

const TAB_VALUES = Object.values(CUSTOMER_DETAIL_TAB);

const TAB_LABELS: Record<TabValue, string> = {
  [CUSTOMER_DETAIL_TAB.OVERVIEW]: "Overview",
  [CUSTOMER_DETAIL_TAB.ACCOUNTING]: "Accounting",
  [CUSTOMER_DETAIL_TAB.SALES]: "Sales",
  [CUSTOMER_DETAIL_TAB.ESTIMATES]: "Estimates",
  [CUSTOMER_DETAIL_TAB.ACTIVITY]: "Activity",
  [CUSTOMER_DETAIL_TAB.ABOUT]: "About",
  [CUSTOMER_DETAIL_TAB.SETTINGS]: "Settings"
};

const TAB_CONTENT_CLASS = "min-h-0 flex-1 overflow-y-auto px-3 py-3";
const TAB_CONTENT_TABLE_CLASS = "flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3";
const ACCOUNTING_CONTENT_CLASS = TAB_CONTENT_TABLE_CLASS;

export function DetailTabs({
  customerId,
  customer,
  value,
  onTabChange
}: {
  customerId: string;
  customer: Customer;
  value: TabValue;
  onTabChange: (tab: TabValue) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onTabChange(v as TabValue)}
      className="flex min-h-0 flex-1 flex-col gap-0"
    >
      <div className="border-border bg-background shrink-0 overflow-hidden border-b px-3 py-2">
        <TabsList className="h-9 overflow-x-auto">
          {TAB_VALUES.map((tabValue) => (
            <TabsTrigger key={tabValue} value={tabValue} className="cursor-pointer">
              {TAB_LABELS[tabValue]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value={CUSTOMER_DETAIL_TAB.OVERVIEW} className={TAB_CONTENT_CLASS}>
        <OverviewTab customerId={customerId} customer={customer} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.ACCOUNTING} className={ACCOUNTING_CONTENT_CLASS}>
        <AccountingTab customer={customer} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.SALES} className={TAB_CONTENT_TABLE_CLASS}>
        <SalesTab customerId={customerId} customerName={customer.name} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.ESTIMATES} className={TAB_CONTENT_TABLE_CLASS}>
        <EstimatesTab customerId={customerId} customerName={customer.name} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.ACTIVITY} className={TAB_CONTENT_CLASS}>
        <ActivityTab customerId={customerId} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.ABOUT} className={TAB_CONTENT_CLASS}>
        <AboutTab customerId={customerId} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.SETTINGS} className={TAB_CONTENT_CLASS}>
        <SettingsTab customer={customer} />
      </TabsContent>
    </Tabs>
  );
}
