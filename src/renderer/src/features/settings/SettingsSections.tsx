import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { FolderOpen } from "lucide-react";
import { SettingsField } from "./SettingsField";

const SectionHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <header>
    <h2 className="text-foreground text-3xl font-semibold tracking-tight">{title}</h2>
    <p className="text-muted-foreground mt-2 text-base leading-7">{subtitle}</p>
  </header>
);

export const GeneralSettingsPage = () => {
  return (
    <section>
      <SectionHeading
        title="General"
        subtitle="Manage store identity and default save preferences for daily operations."
      />
      <div className="mt-6">
        <SettingsField
          label="Default PDF save location"
          hint="Invoices and receipts will use this path by default."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input defaultValue="D:/POS Tree/Exports/PDF" />
            <Button variant="outline">
              <FolderOpen className="size-4" />
              Browse
            </Button>
          </div>
        </SettingsField>
        <Separator />
        <SettingsField label="Store information" hint="Shown on bills and export metadata.">
          <div className="grid gap-3">
            <Input placeholder="Store name" defaultValue="Prajwal Mart" />
            <Input placeholder="Store phone" defaultValue="+91 98765 43210" />
            <Input placeholder="Store address" defaultValue="12 Market Road, Bengaluru" />
          </div>
        </SettingsField>
      </div>
    </section>
  );
};

export const BillingSettingsPage = () => {
  return (
    <section>
      <SectionHeading
        title="Billing"
        subtitle="Control transaction defaults, draft behavior, and autosave preferences."
      />
      <div className="mt-6">
        <SettingsField
          label="Empty transaction handling"
          hint="Choose what happens when a transaction has no line items."
        >
          <Select defaultValue="keep-empty">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delete-empty">Delete Empty Transactions</SelectItem>
              <SelectItem value="keep-empty">Keep Empty Transactions</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
        <Separator />
        <SettingsField
          label="Default customer"
          hint="Pre-select a customer when creating a new bill."
        >
          <Select defaultValue="none">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="walk-in">Walk-in Customer</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
        <Separator />
        <SettingsField
          label="Show drafts popup menu"
          hint="Display quick actions for billing drafts."
        >
          <div className="flex h-9 items-center justify-end">
            <Switch defaultChecked aria-label="Show drafts popup menu" />
          </div>
        </SettingsField>
        <Separator />
        <SettingsField
          label="Enable autosave"
          hint="Automatically save draft changes while billing."
        >
          <div className="flex h-9 items-center justify-end">
            <Switch defaultChecked aria-label="Enable autosave" />
          </div>
        </SettingsField>
        <Separator />
        <SettingsField
          label="Autosave interval (seconds)"
          hint="Lower values save more frequently but increase write operations."
        >
          <Input type="number" defaultValue="45" className="appearance-none" />
        </SettingsField>
      </div>
    </section>
  );
};

export const DashboardSettingsPage = () => {
  return (
    <section>
      <SectionHeading
        title="Dashboard"
        subtitle="Set default sorting and reset behavior for analytics views."
      />
      <div className="mt-6">
        <SettingsField
          label="Date range reset timeout (minutes)"
          hint="Resets dashboard filter state after inactivity."
        >
          <Input type="number" defaultValue="15" className="appearance-none" />
        </SettingsField>
        <Separator />
        <SettingsField
          label="Default dashboard sort order"
          hint="Applies to transaction lists on dashboard widgets."
        >
          <Select defaultValue="date-desc">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest first</SelectItem>
              <SelectItem value="date-asc">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
      </div>
    </section>
  );
};

export const ExportsSettingsPage = () => {
  return (
    <section>
      <SectionHeading
        title="Exports"
        subtitle="Define the default format and document structure for generated exports."
      />
      <div className="mt-6">
        <SettingsField
          label="PDF export layout"
          hint="Choose visual structure for printable output."
        >
          <Select defaultValue="compact">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact Layout</SelectItem>
              <SelectItem value="classic">Classic Layout</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
        <Separator />
        <SettingsField
          label="Default export format"
          hint="Used when no format is explicitly selected during export."
        >
          <Select defaultValue="db">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="db">Database Backup</SelectItem>
              <SelectItem value="zip">ZIP Archive</SelectItem>
              <SelectItem value="csv">CSV File</SelectItem>
              <SelectItem value="images">Image Files</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
      </div>
    </section>
  );
};

export const StorageSettingsPage = () => {
  return (
    <section>
      <SectionHeading
        title="Storage"
        subtitle="Control how and where output files are saved during billing and exports."
      />
      <div className="mt-6">
        <SettingsField
          label="PDF save behavior"
          hint="Prompt each time or always use the configured default location."
        >
          <Select defaultValue="preset-path">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prompt">Ask Every Time</SelectItem>
              <SelectItem value="preset-path">Use Preset Location</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
      </div>
    </section>
  );
};
