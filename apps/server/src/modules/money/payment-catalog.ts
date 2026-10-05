export const ENTRY_PROVIDERS = ["PhonePe", "Paytm"] as const;

export function entryProviderName(name: string): (typeof ENTRY_PROVIDERS)[number] | null {
  return ENTRY_PROVIDERS.find((provider) => provider.toLowerCase() === name.toLowerCase()) ?? null;
}

export const UNSUPPORTED_METHOD_MESSAGE =
  "Choose Cash, PhonePe, or Paytm for new entries. Earlier payment methods remain available in history.";
