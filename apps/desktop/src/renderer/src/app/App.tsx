import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { AppTitleBar } from "./layouts/AppTitleBar";
import { router } from "./routes";

const App = () => {
  return (
    <div data-surface="canvas" className="bg-background-secondary flex h-screen w-full flex-col">
      <AppTitleBar />
      <div className="min-h-0 flex-1">
        <AppErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster
              position="bottom-center"
              toastOptions={{
                className: "text-sm leading-snug font-medium whitespace-normal",
                style: {
                  maxWidth: "20rem",
                  padding: "0.5rem 0.75rem",
                  overflowWrap: "anywhere"
                }
              }}
            />
          </QueryClientProvider>
        </AppErrorBoundary>
      </div>
    </div>
  );
};

export default App;
