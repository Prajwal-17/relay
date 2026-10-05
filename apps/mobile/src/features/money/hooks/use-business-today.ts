import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { getTodayIST } from "@/lib/format/dates";

export function useBusinessToday() {
  const [today, setToday] = useState(getTodayIST);
  useEffect(() => {
    const update = () => setToday(getTodayIST());
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") update();
    });
    const timer = setInterval(update, 30_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);
  return today;
}
