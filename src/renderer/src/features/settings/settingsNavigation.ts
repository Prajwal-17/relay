export const settingsNavigation = [
  { id: "general", label: "General" },
  { id: "billing", label: "Billing" },
  { id: "dashboard", label: "Dashboard" },
  { id: "exports", label: "Exports" },
  { id: "storage", label: "Storage" }
] as const;

export type SettingsSectionId = (typeof settingsNavigation)[number]["id"];
