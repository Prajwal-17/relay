import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="from-primary to-sidebar-primary bg-linear-to-r bg-clip-text text-6xl font-bold text-transparent">
              404
            </h1>

            <h2 className="text-foreground text-2xl font-bold">Oops! Page Not Found</h2>

            <p className="text-muted-foreground mx-auto max-w-md text-lg leading-relaxed">
              The path you&apos;re looking for doesn&apos;t exist.
            </p>

            <div className="border-border bg-card mx-auto my-6 max-w-md rounded-lg border p-4">
              <p className="text-muted-foreground mb-2 text-sm">Wrong path entered:</p>
              <code className="text-foreground font-mono text-base break-all">{pathname}</code>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                size="lg"
                className="group bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-full px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
                // go back to previous url
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                Go Back
              </Button>
              <NavLink to="/">
                <Button
                  size="lg"
                  className="group bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-full px-8 py-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  Go Back Home
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
