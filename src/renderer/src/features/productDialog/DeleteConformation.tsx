import { Button } from "@/components/ui/button";
import type { UseMutationResult } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";

export const DeleteConfirmation = ({
  showDeleteConfirm,
  setShowDeleteConfirm,
  deleteProductMutation,
  productId
}: {
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  deleteProductMutation: UseMutationResult<null, Error, string>;
  productId: string | null;
}) => {
  if (!showDeleteConfirm) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="border-destructive/30 bg-destructive/5 space-y-4 rounded-xl border p-5"
    >
      <div className="flex items-start gap-4">
        <AlertTriangle className="text-destructive mt-0.5 h-6 w-6 shrink-0" />
        <div className="space-y-1">
          <p className="text-destructive text-base font-semibold">
            Are you sure you want to delete this product?
          </p>
          <p className="text-muted-foreground text-sm">
            This action cannot be undone. The product will be permanently removed.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={deleteProductMutation.isPending}
          onClick={() => setShowDeleteConfirm(false)}
          className="h-11 flex-1 cursor-pointer text-base transition-all duration-160 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={deleteProductMutation.isPending}
          onClick={() => {
            if (!productId) {
              toast.error("Product Id does not exist.");
              return;
            }
            deleteProductMutation.mutate(productId);
          }}
          className="bg-destructive text-destructive-foreground h-11 flex-1 cursor-pointer text-base transition-all duration-160 ease-out hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
        >
          {deleteProductMutation.isPending ? "Deleting Product..." : "Delete Product"}
        </Button>
      </div>
    </motion.div>
  );
};
