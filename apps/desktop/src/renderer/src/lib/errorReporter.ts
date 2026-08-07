export type ConsoleReportSource =
  | "app-boundary"
  | "react-caught"
  | "react-uncaught"
  | "react-recoverable"
  | "window-error"
  | "unhandled-rejection";

type ErrorReport = {
  source: ConsoleReportSource;
  error: unknown;
  componentStack?: string;
};

const reportedObjects = new WeakSet<object>();
const reportedPrimitives = new Set<string>();

export const reportRendererError = ({ source, error, componentStack }: ErrorReport) => {
  if ((typeof error === "object" && error !== null) || typeof error === "function") {
    if (reportedObjects.has(error as object)) return;
    reportedObjects.add(error as object);
  } else {
    const key = `${source}:${String(error)}`;
    if (reportedPrimitives.has(key)) return;
    reportedPrimitives.add(key);
    if (reportedPrimitives.size > 100) reportedPrimitives.clear();
  }

  console.error("[QuickCart renderer error]", {
    source,
    error,
    componentStack,
    route: `${window.location.pathname}${window.location.hash}`
  });
};

export const installLastResortErrorListeners = () => {
  const onError = (event: ErrorEvent) =>
    reportRendererError({ source: "window-error", error: event.error ?? event.message });
  const onUnhandledRejection = (event: PromiseRejectionEvent) =>
    reportRendererError({ source: "unhandled-rejection", error: event.reason });

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
};
