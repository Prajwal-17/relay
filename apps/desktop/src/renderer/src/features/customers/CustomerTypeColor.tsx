export const getCustomerTypeColor = (type: string | null) => {
  switch (type) {
    case "cash":
    case "paid":
      return "bg-success/15 text-success";
    case "account":
      return "bg-info/15 text-info";
    case "hotel":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};
