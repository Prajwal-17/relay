export const settingsNavigation = [
  { id: "store-profile", label: "Store Profile" },
  { id: "billing", label: "Billing" },
  { id: "exports", label: "Exports & Storage" }
] as const;

export type SettingsSectionId = (typeof settingsNavigation)[number]["id"];
