import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Customer } from "@shared/types";
import { Archive, GitMerge, Trash2 } from "lucide-react";
import { useState } from "react";
import { SectionCard } from "../shared/SectionCard";

export function SettingsTab({ customer }: { customer: Customer }) {
  const [mergeOpen, setMergeOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Danger Zone" description="Irreversible actions. Proceed with caution.">
        <ul className="divide-border/70 flex flex-col divide-y">
          <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
            <div className="min-w-0">
              <p className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <Archive className="text-warning size-4" />
                Archive this customer
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm font-medium">
                Hides the customer from lists. Existing transactions are preserved.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-warning/30 text-warning hover:bg-warning/10 h-9 shrink-0 cursor-pointer"
                >
                  Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive {customer.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The customer will be hidden from lists but all historical data is retained. You
                    can restore them later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-warning hover:bg-warning/80 text-warning-foreground cursor-pointer">
                    Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>

          <li className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <GitMerge className="text-foreground size-4" />
                Merge with another customer
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm font-medium">
                Move all transactions to a target customer and remove this duplicate.
              </p>
            </div>
            <AlertDialog open={mergeOpen} onOpenChange={setMergeOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="h-9 shrink-0 cursor-pointer">
                  Merge
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Merge customer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pick a target customer to merge <strong>{customer.name}</strong> into. All
                    transactions will be transferred. (Target picker is a placeholder in this
                    preview.)
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="bg-muted/40 border-border/70 text-muted-foreground rounded-lg border px-3 py-2 text-sm font-medium">
                  Target customer picker — not yet implemented.
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-primary hover:bg-primary-hover cursor-pointer"
                    onClick={() => setMergeOpen(false)}
                  >
                    Merge (stub)
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>

          <li className="flex items-center justify-between gap-3 py-3 last:pb-0">
            <div className="min-w-0">
              <p className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <Trash2 className="text-destructive size-4" />
                Delete permanently
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm font-medium">
                Removes the customer and all associated data. This cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="h-9 shrink-0 cursor-pointer">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes <strong>{customer.name}</strong> and all related
                    transactions. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive hover:bg-destructive/80 text-destructive-foreground cursor-pointer">
                    Confirm Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
