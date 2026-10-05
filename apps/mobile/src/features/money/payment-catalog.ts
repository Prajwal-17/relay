import type { PaymentMethod } from "./money.types";

export const ENTRY_PROVIDERS = ["PhonePe", "Paytm"] as const;

export function isEntryProvider(name: string) {
  return ENTRY_PROVIDERS.some((provider) => provider.toLowerCase() === name.toLowerCase());
}

export function entryMethods(methods: PaymentMethod[]) {
  return ENTRY_PROVIDERS.flatMap((name) => {
    const method = methods.find(
      (method) => method.name.toLowerCase() === name.toLowerCase() && !method.isArchived
    );
    return method ? [{ ...method, name }] : [];
  });
}
