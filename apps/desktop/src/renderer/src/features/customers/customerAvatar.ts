export const CUSTOMER_AVATAR_STYLES = [
  "bg-selected text-foreground",
  "bg-hover text-foreground",
  "bg-table-header text-foreground"
] as const;

function stableHash(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getCustomerAvatarStyle(
  customerId: string | null | undefined,
  customerName: string
): (typeof CUSTOMER_AVATAR_STYLES)[number] {
  const key = customerId?.trim() || customerName.trim().toLowerCase() || "customer";
  return CUSTOMER_AVATAR_STYLES[stableHash(key) % CUSTOMER_AVATAR_STYLES.length]!;
}
