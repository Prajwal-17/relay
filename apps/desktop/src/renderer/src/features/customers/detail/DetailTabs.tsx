import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CustomerMock } from "../_mock/types";
import { OverviewTab } from "./tabs/OverviewTab";
import { AccountingTab } from "./tabs/AccountingTab";
import { SalesTab } from "./tabs/SalesTab";
import { EstimatesTab } from "./tabs/EstimatesTab";
import { ActivityTab } from "./tabs/ActivityTab";
import { AboutTab } from "./tabs/AboutTab";
import { AttachmentsTab } from "./tabs/AttachmentsTab";
import { NotesTab } from "./tabs/NotesTab";
import { SettingsTab } from "./tabs/SettingsTab";

export const TAB_VALUES = [
  "overview",
  "accounting",
  "sales",
  "estimates",
  "activity",
  "about",
  "attachments",
  "notes",
  "settings"
] as const;

export type TabValue = (typeof TAB_VALUES)[number];

const TAB_LABELS: Record<TabValue, string> = {
  overview: "Overview",
  accounting: "Accounting",
  sales: "Sales",
  estimates: "Estimates",
  activity: "Activity",
  about: "About",
  attachments: "Attachments",
  notes: "Notes",
  settings: "Settings"
};

/**
 * Pinned tab rail (TabsList stays visible) + independently scrolling tab body.
 * The parent constrains height so each TabsContent scrolls in place.
 */
const TAB_CONTENT_CLASS = "min-h-0 flex-1 overflow-y-auto";

export function DetailTabs({
  customer,
  onRecordPayment
}: {
  customer: CustomerMock;
  onRecordPayment: () => void;
}) {
  return (
    <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3">
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

      <TabsContent value="overview" className={TAB_CONTENT_CLASS}>
        <OverviewTab customer={customer} />
      </TabsContent>
      <TabsContent value="accounting" className={TAB_CONTENT_CLASS}>
        <AccountingTab customer={customer} onRecordPayment={onRecordPayment} />
      </TabsContent>
      <TabsContent value="sales" className={TAB_CONTENT_CLASS}>
        <SalesTab />
      </TabsContent>
      <TabsContent value="estimates" className={TAB_CONTENT_CLASS}>
        <EstimatesTab />
      </TabsContent>
      <TabsContent value="activity" className={TAB_CONTENT_CLASS}>
        <ActivityTab />
      </TabsContent>
      <TabsContent value="about" className={TAB_CONTENT_CLASS}>
        <AboutTab customer={customer} />
      </TabsContent>
      <TabsContent value="attachments" className={TAB_CONTENT_CLASS}>
        <AttachmentsTab />
      </TabsContent>
      <TabsContent value="notes" className={TAB_CONTENT_CLASS}>
        <NotesTab />
      </TabsContent>
      <TabsContent value="settings" className={TAB_CONTENT_CLASS}>
        <SettingsTab customer={customer} />
      </TabsContent>
    </Tabs>
  );
}
