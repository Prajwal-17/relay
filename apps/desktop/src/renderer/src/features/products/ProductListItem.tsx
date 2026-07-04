import { HighlightedText } from "@/components/highlighted-text";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ignoredWeight, PROTOCOL_NAME } from "@/constants";
import { useProductDialog } from "@/hooks/products/useProductDialog";
import { useProductsStore } from "@/store/productsStore";
import {
  ACTION_TYPE,
  DIALOG_MODE,
  INITIAL_TAB,
  PRODUCT_OPERATION,
  type DialogMode,
  type InitialTab,
  type ProductSearchItemDTO
} from "@shared/types";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatRupee, paisaToRupeeString } from "@shared/utils/utils";
import { fromMilliUnits } from "@shared/utils/milliUnits";
import { Clock, Edit, Eye, Image, RotateCcw, Trash2 } from "lucide-react";

export default function ProductListItem({ product }: { product: ProductSearchItemDTO }) {
  const setProductId = useProductsStore((state) => state.setProductId);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setDialogMode = useProductsStore((state) => state.setDialogMode);
  const setInitialTab = useProductsStore((state) => state.setInitialTab);
  const searchParam = useProductsStore((state) => state.searchParam);

  const {
    activeDialog,
    setActiveDialog,
    dialogMessages,
    softDeleteProductMutation,
    permanentDeleteProductMutation,
    restoreProductMutation
  } = useProductDialog();

  const showWeight =
    product.weight !== null &&
    ignoredWeight.some((w) => `${product.weight}+${product.unit}`.includes(w));

  const prepareAndOpenDialog = (mode: DialogMode, tab: InitialTab = INITIAL_TAB.INFO) => {
    setActionType(ACTION_TYPE.EDIT);
    setDialogMode(mode);
    setInitialTab(tab);
    setProductId(product.id);
    setFormDataState({});
    setOpenProductDialog();
  };

  return (
    <div className="group hover:bg-accent/50 active:bg-accent/70 flex items-center gap-5 px-5 py-2.5 transition-colors">
      <div className="border-border bg-muted/50 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-sm">
        {product.imageUrl ? (
          <img
            src={`${PROTOCOL_NAME}${product.imageUrl}`}
            alt={product.name || "Product-Image"}
            className="h-full w-full object-contain p-0.5"
          />
        ) : (
          <Image className="text-muted-foreground/20 h-7 w-7" strokeWidth={1.25} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`text-xl leading-tight font-semibold ${product.isDeleted ? "text-muted-foreground line-through decoration-1" : "text-foreground"}`}
          >
            <HighlightedText text={product.name} query={searchParam} />
          </h3>
          {showWeight && (
            <Badge
              variant="outline"
              className="border-border/60 bg-secondary/50 text-muted-foreground rounded-md px-2 py-0 text-xs font-medium tracking-normal"
            >
              {product.weight}
              {product.unit}
            </Badge>
          )}
          {product.mrp && (
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/8 text-primary rounded-full px-2.5 py-0.5 text-sm font-semibold tracking-normal"
            >
              MRP ₹{paisaToRupeeString(product.mrp)}
            </Badge>
          )}
        </div>
        <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-sm font-medium">
          <span>{fromMilliUnits(product.totalQuantitySold ?? 0)} sold</span>
          {product.isDeleted && product.deletedAt && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-destructive font-semibold">
                Deleted on {formatDateStr(product.deletedAt)}
              </span>
            </>
          )}
          {product.isDisabled && !product.isDeleted && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-destructive font-semibold">
                {product.disabledAt
                  ? `Disabled on ${formatDateStr(product.disabledAt)}`
                  : "Disabled"}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-foreground text-2xl font-bold">{formatRupee(product.price)}</div>
      </div>

      {product.isDeleted ? (
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => prepareAndOpenDialog(DIALOG_MODE.VIEW)}
                className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
              >
                <Eye className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-base">View</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => prepareAndOpenDialog(DIALOG_MODE.VIEW, INITIAL_TAB.HISTORY)}
                className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
              >
                <Clock className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-base">History</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveDialog(PRODUCT_OPERATION.PERMANENT_DELETE)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-base">Permanently Delete</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveDialog(PRODUCT_OPERATION.RESTORE)}
                className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-base">Restore</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => prepareAndOpenDialog(DIALOG_MODE.VIEW)}
                className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
              >
                <Eye className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-base">View</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => prepareAndOpenDialog(DIALOG_MODE.EDIT)}
                className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
              >
                <Edit className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-base">Edit</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveDialog(PRODUCT_OPERATION.SOFT_DELETE)}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-base">Delete</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => prepareAndOpenDialog(DIALOG_MODE.VIEW, INITIAL_TAB.HISTORY)}
                className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
              >
                <Clock className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-base">History</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <AlertDialog
        open={activeDialog === PRODUCT_OPERATION.SOFT_DELETE}
        onOpenChange={(isOpen) => !isOpen && setActiveDialog(PRODUCT_OPERATION.IDLE)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">
              {dialogMessages[PRODUCT_OPERATION.SOFT_DELETE].title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {dialogMessages[PRODUCT_OPERATION.SOFT_DELETE].description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/80 text-destructive-foreground cursor-pointer"
              onClick={() => softDeleteProductMutation.mutate(product.id)}
              disabled={softDeleteProductMutation.isPending}
            >
              {softDeleteProductMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={activeDialog === PRODUCT_OPERATION.PERMANENT_DELETE}
        onOpenChange={(isOpen) => !isOpen && setActiveDialog(PRODUCT_OPERATION.IDLE)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">
              {dialogMessages[PRODUCT_OPERATION.PERMANENT_DELETE].title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {dialogMessages[PRODUCT_OPERATION.PERMANENT_DELETE].description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/80 text-destructive-foreground cursor-pointer"
              onClick={() => permanentDeleteProductMutation.mutate(product.id)}
              disabled={permanentDeleteProductMutation.isPending}
            >
              {permanentDeleteProductMutation.isPending ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={activeDialog === PRODUCT_OPERATION.RESTORE}
        onOpenChange={(isOpen) => !isOpen && setActiveDialog(PRODUCT_OPERATION.IDLE)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">
              {dialogMessages[PRODUCT_OPERATION.RESTORE].title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {dialogMessages[PRODUCT_OPERATION.RESTORE].description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-primary/80 text-primary-foreground cursor-pointer"
              onClick={() => restoreProductMutation.mutate(product.id)}
              disabled={restoreProductMutation.isPending}
            >
              {restoreProductMutation.isPending ? "Restoring..." : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
