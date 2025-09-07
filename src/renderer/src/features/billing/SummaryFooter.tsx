"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import useTransactionState from "@/hooks/useTransactionState";
import { ChevronDown, FileText, MessageSquare, Printer, Save, Send } from "lucide-react";

export const SummaryFooter = () => {
  const { lineItems } = useTransactionState();

  const totalAmount = lineItems.reduce((sum, currentItem) => {
    return sum + Number(currentItem.totalPrice || 0);
  }, 0);

  const IndianRupees = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  });

  return (
    <footer
      className="bg-background absolute right-0 bottom-0 left-0 border-t shadow-lg"
      role="contentinfo"
    >
      <div className="flex items-center justify-end gap-6 px-3 py-3">
        <div className="flex items-center gap-8 text-right">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground text-lg">Subtotal:</span>
            <span className="text-foreground text-lg font-semibold">
              {IndianRupees.format(totalAmount)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xl font-medium">Total:</span>
            <span className="text-primary text-3xl font-bold">
              {IndianRupees.format(Math.round(totalAmount))}
            </span>
          </div>
        </div>

        <div className="bg-border h-12 w-px" />

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="lg"
            className="bg-primary hover:bg-primary/90 h-12 cursor-pointer text-lg"
          >
            <Printer className="mr-2 h-8 w-8" size={20} />
            Save & Print
          </Button>

          <Button variant="outline" size="lg" className="h-12 text-lg hover:cursor-pointer">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="hover:cusor-pointer h-12 bg-transparent text-lg"
              >
                <Send className="mr-2 h-4 w-4" />
                Send
                <ChevronDown className="ml-2 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send via Text
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Send via PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </footer>
  );
};
