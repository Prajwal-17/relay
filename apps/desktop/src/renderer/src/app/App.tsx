import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { router } from "./routes";

const App = () => {
  return (
    <AppErrorBoundary>
      <div className="bg-background-secondary">
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
      </div>
    </AppErrorBoundary>
  );
};

export default App;
