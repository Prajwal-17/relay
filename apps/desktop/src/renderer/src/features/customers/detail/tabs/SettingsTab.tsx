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
import { useArchiveCustomer } from "@/features/customers/hooks/useArchiveCustomer";
import { useDeleteCustomer } from "@/features/customers/hooks/useDeleteCustomer";
import type { Customer } from "@shared/types";
import { Archive, Undo2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SectionCard } from "../SectionCard";

export function SettingsTab({ customer }: { customer: Customer }) {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useDeleteCustomer(customer.id);
  const { archiveMutation, restoreMutation } = useArchiveCustomer(customer.id);

  const isArchived = customer.isArchived;

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setDeleteOpen(false);
        navigate("/customers", { replace: true });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Danger Zone" description="Irreversible actions. Proceed with caution.">
        <ul className="divide-border/70 flex flex-col divide-y">
          <li className="flex items-center justify-between gap-3 py-3 first:pt-0">
            <div className="min-w-0">
              <p className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <Archive className="size-4" />
                {isArchived ? "Restore this customer" : "Archive this customer"}
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm font-medium">
                {isArchived
                  ? "Make this customer visible again in lists and search."
                  : "Hides the customer from lists and search. Existing transactions are preserved."}
              </p>
            </div>
            {isArchived ? (
              <Button
                variant="outline"
                className="h-9 shrink-0 cursor-pointer"
                disabled={restoreMutation.isPending}
                onClick={() => restoreMutation.mutate()}
              >
                <Undo2 className="size-4" />
                Restore
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-9 shrink-0 cursor-pointer"
                disabled={archiveMutation.isPending}
                onClick={() => archiveMutation.mutate()}
              >
                <Archive className="size-4" />
                Archive
              </Button>
            )}
          </li>

          <li className="flex items-center justify-between gap-3 py-3 last:pb-0">
            <div className="min-w-0">
              <p className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <Trash2 className="text-destructive size-4" />
                Delete permanently
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm font-medium">
                Removes the customer completely. Only works if no transactions exist.
              </p>
            </div>
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
                    This permanently deletes <strong>{customer.name}</strong>. This action cannot be
                    undone. If the customer has any transactions, the deletion will be blocked.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/80 text-destructive-foreground cursor-pointer"
                    disabled={deleteMutation.isPending}
                    onClick={handleDelete}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
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
