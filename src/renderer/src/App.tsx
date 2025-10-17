import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

const queryClient = new QueryClient();

const App = () => {
  return (
    <div className="bg-background-secondary">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: "text-lg font-medium"
          }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </div>
  );
};

export default App;
