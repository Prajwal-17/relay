import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, MapPinOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <main className="bg-background flex h-full min-h-0 items-center justify-center p-3">
      <section className="border-border bg-card w-full max-w-md rounded-(--radius-panel) border p-4 text-center">
        <span className="bg-hover text-foreground mx-auto flex size-10 items-center justify-center rounded-(--radius-control)">
          <MapPinOff className="size-5" />
        </span>
        <p className="text-foreground mt-3 text-xs font-semibold tracking-wide uppercase">
          Error 404
        </p>
        <h1 className="text-foreground mt-1 text-lg font-semibold">Page not found</h1>
        <p className="text-muted-foreground mt-1 text-sm">This location does not exist in Relay.</p>
        <code className="border-border bg-muted text-foreground mt-3 block overflow-hidden rounded-(--radius-control) border px-3 py-2 font-mono text-xs text-ellipsis whitespace-nowrap">
          {pathname}
        </code>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="size-4" />
            Dashboard
          </Button>
        </div>
      </section>
    </main>
  );
}
