import { ErrorState } from "@/components/app-ui/ErrorState";
import { reportRendererError } from "@/lib/errorReporter";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportRendererError({
      source: "app-boundary",
      error,
      componentStack: info.componentStack ?? undefined
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-background h-screen w-full">
          <ErrorState
            layout="page"
            title="QuickCart needs to reload"
            description="An unexpected application error occurred. Reload to return to a safe state."
            primaryAction={{ label: "Reload QuickCart", onClick: () => window.location.reload() }}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
