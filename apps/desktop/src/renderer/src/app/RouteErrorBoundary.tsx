import { ErrorState } from "@/components/app-ui/ErrorState";
import { ApiError } from "@/lib/apiClient";
import { isRouteErrorResponse, useLocation, useNavigate, useRouteError } from "react-router-dom";

type BoundaryScope = "root" | "workspace" | "billing" | "pdf";

const copyByScope: Record<BoundaryScope, { title: string; description: string }> = {
  root: {
    title: "QuickCart could not open",
    description: "An unexpected startup error occurred. Reload QuickCart to try again."
  },
  workspace: {
    title: "This page could not be displayed",
    description: "The rest of QuickCart is still available. Try this page again or return home."
  },
  billing: {
    title: "Billing encountered an unexpected error",
    description:
      "Unsaved work may be affected. Reload QuickCart to restore billing, or return to the dashboard."
  },
  pdf: {
    title: "The PDF preview could not be displayed",
    description: "Close this window and try exporting again. You can also reload this preview."
  }
};

export const RouteErrorBoundary = ({ scope }: { scope: BoundaryScope }) => {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();
  const copy = copyByScope[scope];
  const isNotFound =
    (error instanceof ApiError && error.status === 404) ||
    (isRouteErrorResponse(error) && error.status === 404);

  const retryRoute = () => navigate(`${location.pathname}${location.search}`, { replace: true });
  const fullWindow = scope === "root" || scope === "pdf";

  return (
    <div className={fullWindow ? "bg-background h-screen w-full" : "bg-background h-full p-3"}>
      <ErrorState
        layout="page"
        title={isNotFound ? "The requested record was not found" : copy.title}
        description={
          isNotFound
            ? "It may have been deleted or the link may no longer be valid."
            : copy.description
        }
        primaryAction={
          scope === "root" || scope === "billing"
            ? { label: "Reload QuickCart", onClick: () => window.location.reload() }
            : { label: "Try again", onClick: retryRoute }
        }
        secondaryAction={
          scope === "pdf"
            ? { label: "Close window", onClick: () => window.close() }
            : scope === "billing"
              ? { label: "Return to dashboard", onClick: () => navigate("/", { replace: true }) }
              : scope === "workspace"
                ? { label: "Return home", onClick: () => navigate("/", { replace: true }) }
                : undefined
        }
      />
    </div>
  );
};
