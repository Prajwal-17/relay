import relayAppIcon from "@assets/desktop/app-icon-small.svg";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./index.css";
import { installLastResortErrorListeners, reportRendererError } from "./lib/errorReporter";

document.getElementById("favicon")?.setAttribute("href", relayAppIcon);

if (import.meta.env.MODE === "production") installLastResortErrorListeners();

createRoot(document.getElementById("root")!, {
  onCaughtError: (error, errorInfo) =>
    reportRendererError({
      source: "react-caught",
      error,
      componentStack: errorInfo.componentStack
    }),
  onUncaughtError: (error, errorInfo) =>
    reportRendererError({
      source: "react-uncaught",
      error,
      componentStack: errorInfo.componentStack
    }),
  onRecoverableError: (error, errorInfo) =>
    reportRendererError({
      source: "react-recoverable",
      error,
      componentStack: errorInfo.componentStack
    })
}).render(
  <StrictMode>
    <App />
  </StrictMode>
);
