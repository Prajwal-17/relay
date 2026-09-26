const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true
});

export function paymentTime(timestamp: string): string {
  if (Number.isNaN(Date.parse(timestamp))) return "Time unavailable";
  return dateTimeFormatter.format(new Date(timestamp));
}
