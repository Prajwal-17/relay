export const settingsNavigation = [
  { id: "appearance", label: "Appearance" },
  { id: "store-profile", label: "Store Profile" },
  { id: "billing", label: "Billing" },
  { id: "printing", label: "Printing" },
  { id: "exports", label: "Exports & Storage" }
] as const;

export type SettingsSectionId = (typeof settingsNavigation)[number]["id"];
