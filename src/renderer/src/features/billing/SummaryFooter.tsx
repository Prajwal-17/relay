import { Button } from "@/components/ui/button";
import { useTransactionActions } from "@/hooks/useTransactionActions";
import { TRANSACTION_TYPE } from "@shared/types";
import { IndianRupees } from "@shared/utils/utils";
import { FileText, Printer, Save } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";

export const SummaryFooter = () => {
  const { type } = useParams();

  const { calcTotalAmount, handleAction } = useTransactionActions(
    type === TRANSACTION_TYPE.SALES ? TRANSACTION_TYPE.SALES : TRANSACTION_TYPE.ESTIMATES
  );

  if (!type) {
    return <Navigate to="/not-found" />;
  }

  return (
    <footer
      className="bg-background absolute right-0 bottom-0 left-0 border-t shadow-lg"
      role="contentinfo"
    >
      <div className="flex items-center justify-end gap-6 px-3 py-2">
        <div className="flex items-center gap-8 text-right">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground text-lg">Subtotal:</span>
            <span className="text-foreground text-lg font-semibold">
              {IndianRupees.format(calcTotalAmount)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xl font-medium">Total:</span>
            <span className="text-foreground text-3xl font-bold">
              {IndianRupees.format(Math.round(calcTotalAmount))}
            </span>
          </div>
        </div>

        <div className="bg-border h-12 w-px" />

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="lg"
            className="bg-primary hover:bg-primary/90 h-12 cursor-pointer text-lg"
            onClick={() => handleAction("save&print")}
          >
            <Printer className="mr-2 h-8 w-8" size={20} />
            Save & Print
          </Button>

          <Button
            onClick={() => handleAction("save")}
            variant="outline"
            size="lg"
            className="h-12 text-lg hover:cursor-pointer"
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>

          <Button
            onClick={() => handleAction("sendViaWhatsapp")}
            variant="outline"
            size="lg"
            className="h-12 text-lg hover:cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4" />
            Save PDF
          </Button>
        </div>
      </div>
    </footer>
  );
};
