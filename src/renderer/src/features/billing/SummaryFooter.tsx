import { Button } from "@/components/ui/button";
import useTransaction from "@/hooks/transaction/useTransaction";
import useTransactionPersistance from "@/hooks/transaction/useTransactionPersistance";
import { FileText, Printer, Save } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { BillingSaveStatus } from "./BillingSaveStatus";

export const SummaryFooter = () => {
  const { type } = useParams();

  const { subtotal, grandTotal } = useTransaction();
  const { handleManualAction, isSaving } = useTransactionPersistance();

  if (!type) {
    return <Navigate to="/not-found" />;
  }

  return (
    <footer
      className="bg-background absolute right-0 bottom-0 left-0 border-t shadow-lg"
      role="contentinfo"
    >
      <div className="relative flex items-center justify-end gap-6 px-3 py-2">
        <div className="absolute top-0 right-2 -translate-y-full">
          <BillingSaveStatus />
        </div>

        <div className="flex items-center gap-8 text-right">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground text-lg">Subtotal:</span>
            <span className="text-foreground text-lg font-semibold">{subtotal}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xl font-medium">Total:</span>
            <span className="text-foreground text-3xl font-bold">{grandTotal}</span>
          </div>
        </div>

        <div className="bg-border h-12 w-px" />

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="lg"
            className="bg-primary hover:bg-primary/90 h-12 cursor-pointer text-lg"
            onClick={() => handleManualAction("save&print")}
            disabled={isSaving}
          >
            <Printer className="mr-2 h-8 w-8" size={20} />
            {isSaving ? "Saving ..." : "Save & Print"}
          </Button>

          <Button
            onClick={() => handleManualAction("save")}
            variant="outline"
            size="lg"
            className="h-12 text-lg hover:cursor-pointer"
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>

          <Button
            onClick={() => handleManualAction("saveAsPDF")}
            variant="outline"
            size="lg"
            className="h-12 text-lg hover:cursor-pointer"
            disabled={isSaving}
          >
            <FileText className="mr-2 h-4 w-4" />
            {isSaving ? "Saving PDF..." : "Save PDF"}
          </Button>
        </div>
      </div>
    </footer>
  );
};
