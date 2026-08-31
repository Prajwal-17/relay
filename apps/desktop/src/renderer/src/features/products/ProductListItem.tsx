import { HighlightedText } from "@/components/app-ui/highlighted-text";
import { ProductImage } from "@/components/app-ui/product-image";
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
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getProductImageUrl, ignoredWeight } from "@/constants/renderer.constants";
import { useProductDialog } from "@/features/products/hooks/useProductDialog";
import { useProductsStore } from "@/features/products/products.store";
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
import { fromMilliUnits } from "@shared/utils/milliUnits";
import { formatRupee, paisaToRupeeString } from "@shared/utils/utils";
import { Clock, Edit, Eye, RotateCcw, Trash2 } from "lucide-react";

const rowActionClassName =
  "text-muted-foreground hover:bg-card hover:text-foreground cursor-pointer";
const destructiveRowActionClassName =
  "text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer focus-visible:ring-destructive/20";

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
    <div className="bg-card hover:bg-hover active:bg-selected group flex min-h-(--product-row-height) items-center gap-2.5 border-b px-3 py-2 transition-colors">
      <ProductImage
        src={product.imageUrl ? getProductImageUrl(product.imageUrl) : null}
        alt={product.name || "Product"}
        className="border-border bg-card border"
        imageClassName="p-0.5"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`truncate text-base leading-tight font-semibold ${product.isDeleted ? "text-muted-foreground line-through decoration-1" : "text-foreground"}`}
          >
            <HighlightedText text={product.name} query={searchParam} />
          </h3>
          {showWeight && (
            <Badge
              variant="outline"
              className="border-unit-tag-border bg-unit-tag-bg text-unit-tag-text h-6 shrink-0 rounded-(--radius-control) px-2 py-0 text-sm leading-none font-semibold shadow-none"
            >
              {product.weight}
              {product.unit}
            </Badge>
          )}
          {product.mrp && (
            <Badge
              variant="outline"
              className="border-mrp-tag-border bg-mrp-tag-bg text-mrp-tag-text h-6 shrink-0 rounded-(--radius-control) px-2 py-0 text-sm leading-none font-semibold tabular-nums shadow-none"
            >
              MRP ₹{paisaToRupeeString(product.mrp)}
            </Badge>
          )}
        </div>
        <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium">
          <span>{fromMilliUnits(product.totalQuantitySold ?? 0)} sold</span>
          {product.purchasePrice !== null && (
            <>
              <span className="text-muted-foreground/40">•</span>
              <span className="inline-flex shrink-0 items-baseline gap-1 whitespace-nowrap">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="text-foreground font-semibold tabular-nums">
                  {formatRupee(product.purchasePrice)}
                </span>
              </span>
            </>
          )}
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
        <div className="text-foreground financial-nums text-base font-semibold">
          {formatRupee(product.price)}
        </div>
      </div>

      {product.isDeleted ? (
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="View product"
                onClick={() => prepareAndOpenDialog(DIALOG_MODE.VIEW)}
                className={rowActionClassName}
              >
                <Eye className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">View</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="View product history"
                onClick={() => prepareAndOpenDialog(DIALOG_MODE.VIEW, INITIAL_TAB.HISTORY)}
                className={rowActionClassName}
              >
                <Clock className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">History</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Permanently delete product"
                onClick={() => setActiveDialog(PRODUCT_OPERATION.PERMANENT_DELETE)}
                className={destructiveRowActionClassName}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Permanently Delete</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Restore product"
                onClick={() => setActiveDialog(PRODUCT_OPERATION.RESTORE)}
                className={rowActionClassName}
              >
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Restore</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="View product"
                onClick={() => prepareAndOpenDialog(DIALOG_MODE.VIEW)}
                className={rowActionClassName}
              >
                <Eye className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">View</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Edit product"
                onClick={() => prepareAndOpenDialog(DIALOG_MODE.EDIT)}
                className={rowActionClassName}
              >
                <Edit className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Edit</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Delete product"
                onClick={() => setActiveDialog(PRODUCT_OPERATION.SOFT_DELETE)}
                className={destructiveRowActionClassName}
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Delete</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="View product history"
                onClick={() => prepareAndOpenDialog(DIALOG_MODE.VIEW, INITIAL_TAB.HISTORY)}
                className={rowActionClassName}
              >
                <Clock className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">History</p>
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
              onClick={() =>
                permanentDeleteProductMutation.mutate({
                  productId: product.id,
                  imageId: product.imageUrl
                })
              }
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
              className="bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
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
