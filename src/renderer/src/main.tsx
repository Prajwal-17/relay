import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          className: "text-lg font-medium"
        }}
      />
    </HashRouter>
  </StrictMode>
);
