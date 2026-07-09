import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CUSTOMER_DETAIL_TAB, type CustomerDetailTab } from "@/types";
import type { CustomerMock } from "../_mock/types";
import { AboutTab } from "./tabs/AboutTab";
import { AccountingTab } from "./tabs/AccountingTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { AttachmentsTab } from "./tabs/AttachmentsTab";
import { EstimatesTab } from "./tabs/EstimatesTab";
import { NotesTab } from "./tabs/NotesTab";
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
  [CUSTOMER_DETAIL_TAB.ATTACHMENTS]: "Attachments",
  [CUSTOMER_DETAIL_TAB.NOTES]: "Notes",
  [CUSTOMER_DETAIL_TAB.SETTINGS]: "Settings"
};

const TAB_CONTENT_CLASS = "min-h-0 flex-1 overflow-y-auto";
const TAB_CONTENT_TABLE_CLASS = "flex min-h-0 flex-1 flex-col";

export function DetailTabs({
  customerId,
  customer,
  onRecordPayment,
  onActiveTabChange
}: {
  customerId: string;
  customer: CustomerMock;
  onRecordPayment: () => void;
  onActiveTabChange?: (tab: TabValue) => void;
}) {
  return (
    <Tabs
      defaultValue={CUSTOMER_DETAIL_TAB.OVERVIEW}
      onValueChange={(v) => onActiveTabChange?.(v as TabValue)}
      className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3"
    >
      <TabsList className="bg-muted h-9 w-fit shrink-0 flex-wrap gap-0.5 p-1">
        {TAB_VALUES.map((value) => (
          <TabsTrigger
            key={value}
            value={value}
            className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground cursor-pointer px-3 text-sm font-medium transition-colors"
          >
            {TAB_LABELS[value]}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={CUSTOMER_DETAIL_TAB.OVERVIEW} className={TAB_CONTENT_CLASS}>
        <OverviewTab customerId={customerId} customer={customer} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.ACCOUNTING} className={TAB_CONTENT_CLASS}>
        <AccountingTab customer={customer} onRecordPayment={onRecordPayment} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.SALES} className={TAB_CONTENT_TABLE_CLASS}>
        <SalesTab customerId={customerId} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.ESTIMATES} className={TAB_CONTENT_TABLE_CLASS}>
        <EstimatesTab customerId={customerId} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.ACTIVITY} className={TAB_CONTENT_CLASS}>
        <ActivityTab />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.ABOUT} className={TAB_CONTENT_CLASS}>
        <AboutTab customer={customer} />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.ATTACHMENTS} className={TAB_CONTENT_CLASS}>
        <AttachmentsTab />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.NOTES} className={TAB_CONTENT_CLASS}>
        <NotesTab />
      </TabsContent>
      <TabsContent value={CUSTOMER_DETAIL_TAB.SETTINGS} className={TAB_CONTENT_CLASS}>
        <SettingsTab customer={customer} />
      </TabsContent>
    </Tabs>
  );
}
