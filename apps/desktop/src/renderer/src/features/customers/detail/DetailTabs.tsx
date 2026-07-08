import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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

export function DetailTabs({
  customer,
  onRecordPayment
}: {
  customer: CustomerMock;
  onRecordPayment: () => void;
}) {
  return (
    <Tabs defaultValue="overview" className={cn("gap-3")}>
      <TabsList className="bg-muted h-9 w-fit flex-wrap gap-0.5 p-1">
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

      <TabsContent value="overview">
        <OverviewTab customer={customer} />
      </TabsContent>
      <TabsContent value="accounting">
        <AccountingTab customer={customer} onRecordPayment={onRecordPayment} />
      </TabsContent>
      <TabsContent value="sales">
        <SalesTab />
      </TabsContent>
      <TabsContent value="estimates">
        <EstimatesTab />
      </TabsContent>
      <TabsContent value="activity">
        <ActivityTab />
      </TabsContent>
      <TabsContent value="about">
        <AboutTab customer={customer} />
      </TabsContent>
      <TabsContent value="attachments">
        <AttachmentsTab />
      </TabsContent>
      <TabsContent value="notes">
        <NotesTab />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsTab customer={customer} />
      </TabsContent>
    </Tabs>
  );
}
