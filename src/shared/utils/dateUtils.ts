/**
 * Formats date ISOstring("2025-07-22T10:00:00Z") to localeString("22 Jul 2025")
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateStr(dateStr?: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    dateStyle: "medium"
  });
}

/**
 * Format Date object to string medium style
 * @param {Date} dateObj
 * @returns {string}
 */
export function formatDateObjToStringMedium(dateObj: Date) {
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
  const hours = dateObj.getHours().toString().padStart(2, "0");
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

/**
 * Format ISO date string to IST Date Object
 * @param {string} dateStr
 * @returns {Date}
 */
export function formatDateStrToISTDateObject(dateStr: string) {
  // '2025-08-31 06:38:13' -> '2025-08-31T06:38:13Z'
  const utcTimestamp = dateStr.replace(" ", "T") + "Z";

  const date = new Date(utcTimestamp);

  return date;
}

/**
 * Format date string to readable date time format.
 * "2025-09-13 02:30:00" -> "13 Sept 2025 02:30 Am"
 * @param {string} dateStr
 * @returns {fullDate,timePart}
 */
export function formatDateStrToISTDateStr(dateStr: string) {
  const utcTimestamp = dateStr.replace(" ", "T") + "Z";
  const date = new Date(utcTimestamp);

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

/**
 * @param {string} isoString
 * @returns {string}
 */
export function removeTandZ(isoString: string) {
  if (!isoString) return "";
  return isoString.replaceAll("T", " ").replaceAll("Z", " ").slice(0, -5);
}
