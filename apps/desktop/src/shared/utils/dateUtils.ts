/**
 * Formats date ISOstring("2025-07-22T10:00:00Z") to localeString("22 Jul 2025")
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateStr(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== "string") return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata"
  });
}

/**
 * Format Date object to string medium style
 * @param {Date} dateObj
 * @returns {string}
 */
export function formatDateObjToStringMedium(dateObj: Date) {
  if (isNaN(dateObj.getTime())) return "-";
  return dateObj.toLocaleDateString("en-IN", {
    dateStyle: "medium"
  });
}

/**
 * Formats Date object to HH:mm:ss time format
 * @param {Date} dateObj
 * @returns {string}
 */
export function formatDateObjToHHmmss(dateObj: Date) {
  if (isNaN(dateObj.getTime())) return "-";
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

/**
 * Parse a date string to a Date object.
 * - Inputs without timezone info are treated as IST (+05:30).
 * - Inputs with Z or +/-HH:MM offset are parsed as-is.
 * Returns null for invalid/unparseable input.
 */
export function formatDateStrToISTDateObject(dateStr: string) {
  if (!dateStr) return null;

  // extract date
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);

  // to prevent invalid date (e.g. Feb 30 → Mar 2) which returns NaN
  // validate via UTC so we can reject it
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() + 1 !== mo || check.getUTCDate() !== d) {
    return null;
  }

  const withT = dateStr.replace(" ", "T");
  const dateStrForParsing = /(?:Z|[+-]\d{2}:\d{2})$/.test(dateStr) ? withT : withT + "+05:30";

  const date = new Date(dateStrForParsing);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format date string to readable date time format.
 * "2025-09-13T02:30:00Z" -> "13 Sept 2025 02:30 Am"
 * @param {string} dateStr
 * @returns {fullDate,timePart}
 */
export function formatDateStrToISTDateStr(dateStr: string) {
  if (!dateStr) return { fullDate: "-", timePart: "-" };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { fullDate: "-", timePart: "-" };

  const fullDate = date.toLocaleDateString("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata"
  });

  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });

  // return `${fullDate} ${timePart}`;
  return {
    fullDate,
    timePart
  };
}

export function formatDateStrToISTDateTimeStr(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";

  const fullDate = date.toLocaleDateString("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata"
  });

  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });

  return `${fullDate} ${timePart}`;
}

export function isWithinTwoDays(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() <= 48 * 60 * 60 * 1000;
}
