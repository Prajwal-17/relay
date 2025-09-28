export const calendarPresets = [
  {
    label: "Yesterday",
    value: "yesterday",
    getRange: () => {
      const today = new Date();
      // do not use const fromDate = today, this adds a reference and also mutates today
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 1);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(today);
      toDate.setDate(toDate.getDate() - 1);
      toDate.setHours(23, 59, 59, 999);
      return { from: fromDate, to: toDate };
    }
  },
  {
    label: "Today",
    value: "today",
    getRange: () => {
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(today);
      toDate.setHours(23, 59, 59, 999);
      return { from: fromDate, to: toDate };
    }
  },
  {
    label: "Last 7 Days",
    value: "last7days",
    getRange: () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(today);
      endOfWeek.setHours(23, 59, 59, 999);
      return { from: startOfWeek, to: endOfWeek };
    }
  },
  {
    label: "Last 30 Days",
    value: "last30days",
    getRange: () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      return { from: startDate, to: endDate };
    }
  },
  {
    label: "Last 90 Days",
    value: "last90days",
    getRange: () => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(23, 59, 59, 999);
      const endDate = new Date(today);
      endDate.setHours(0, 0, 0, 0);
      return { from: startDate, to: endDate };
    }
  }
];
