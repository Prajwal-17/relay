import { Button } from "@/components/ui/button";
import useTransaction from "@/hooks/transaction/useTransaction";
import { FileText, Printer, Save } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";

export const SummaryFooter = () => {
  const { type } = useParams();

  const { subtotal, grandTotal } = useTransaction();
  const isSaving = false;

  if (!type) {
    return <Navigate to="/not-found" />;
  }

  return (
    <footer className="absolute right-6 bottom-1 z-20">
      <div className="bg-background/60 border-border/50 flex items-center gap-6 rounded-lg border py-1.5 pr-1.5 pl-6 shadow-xl backdrop-blur-xs">
        <div className="flex items-end gap-6">
          <div className="flex items-end gap-2">
            <span className="text-muted-foreground self-end text-sm font-semibold uppercase">
              Subtotal:
            </span>
            <span className="text-foreground text-xl font-semibold">{subtotal}</span>
          </div>

          <div className="bg-border/60 h-8 w-px shrink-0" />

          <div className="flex items-end gap-2">
            <span className="text-muted-foreground self-end text-sm font-semibold uppercase">
              Total:
            </span>
            <span className="text-foreground text-3xl font-bold">{grandTotal}</span>
          </div>
        </div>

        <div className="bg-border/60 h-8 w-px shrink-0" />

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            className="hover:bg-primary/90 h-12 cursor-pointer gap-3 rounded-lg px-6! text-base font-semibold shadow-sm"
            disabled={isSaving}
          >
            <Printer size={18} />
            {isSaving ? "Saving..." : "Save & Print"}
          </Button>

          <Button
            variant="outline"
            className="border-border/60 hover:bg-accent/50 h-12 cursor-pointer gap-3 rounded-lg px-6! text-base font-medium transition-colors"
            disabled={isSaving}
          >
            <Save size={18} className="text-muted-foreground" />
            {isSaving ? "Saving..." : "Save & Exit"}
          </Button>

          <Button
            variant="outline"
            className="border-border/60 hover:bg-accent/50 h-12 cursor-pointer gap-3 rounded-lg px-6! text-base font-medium transition-colors"
            disabled={isSaving}
          >
            <FileText size={18} className="text-muted-foreground" />
            {isSaving ? "Saving PDF..." : "Save PDF"}
          </Button>
        </div>
      </div>
    </footer>
  );
};
