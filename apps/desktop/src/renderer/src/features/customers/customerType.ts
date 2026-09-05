const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  account: "Account",
  hotel: "Hotel"
};

export function formatCustomerType(customerType: string) {
  return CUSTOMER_TYPE_LABELS[customerType] ?? customerType;
}
