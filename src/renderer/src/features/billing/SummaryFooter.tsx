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
    <footer className="" role="contentinfo">
      <div className="bg-background relative mx-5 my-1 flex items-center justify-end gap-4 rounded-xl px-4 py-3 md:gap-6">
        <div className="absolute top-0 right-1 -translate-y-full">
          <BillingSaveStatus />
        </div>

        <div className="flex items-center gap-6 text-right md:gap-8">
          <div className="flex items-center gap-2 text-sm md:text-base">
            <span className="text-muted-foreground text-base md:text-lg">Subtotal:</span>
            <span className="text-foreground text-lg font-semibold">{subtotal}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-muted-foreground text-xl font-medium md:text-2xl">Total:</span>
            <span className="text-foreground text-2xl font-bold md:text-3xl">{grandTotal}</span>
          </div>
        </div>

        <div className="bg-border hidden h-10 w-px md:block" />

        <div className="flex items-center gap-2 md:gap-3">
          <Button
            variant="default"
            size="lg"
            className="bg-primary hover:bg-primary/90 h-11 cursor-pointer rounded-lg px-4 text-base font-medium md:h-12 md:px-5 md:text-lg"
            onClick={() => handleManualAction("save&print")}
            disabled={isSaving}
          >
            <Printer className="mr-2 h-5 w-5 md:h-6 md:w-6" size={20} />
            {isSaving ? "Saving ..." : "Save & Print"}
          </Button>

          <Button
            onClick={() => handleManualAction("save")}
            variant="outline"
            size="lg"
            className="h-11 rounded-lg px-4 text-base font-medium hover:cursor-pointer md:h-12 md:px-5 md:text-lg"
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>

          <Button
            onClick={() => handleManualAction("saveAsPDF")}
            variant="outline"
            size="lg"
            className="h-11 rounded-lg px-4 text-base font-medium hover:cursor-pointer md:h-12 md:px-5 md:text-lg"
            disabled={isSaving}
          >
            <FileText className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            {isSaving ? "Saving PDF..." : "Save PDF"}
          </Button>
        </div>
      </div>
    </footer>
  );
};
