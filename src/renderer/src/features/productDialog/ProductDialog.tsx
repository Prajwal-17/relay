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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useProductDialog } from "@/hooks/products/useProductDialog";
import { useProductFetch } from "@/hooks/products/useProductFetch";
import { useProductsStore } from "@/store/productsStore";
import {
  ACTION_TYPE,
  DIALOG_MODE,
  INITIAL_TAB,
  PRODUCT_OPERATION,
  type InitialTab
} from "@shared/types";
import { formatDateStrToISTDateTimeStr } from "@shared/utils/dateUtils";
import {
  AlertTriangle,
  Clock,
  Edit3,
  Eye,
  Info,
  LoaderCircle,
  ReceiptText,
  RotateCcw,
  Trash2,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ProductEditForm, ProductPreview } from "./ProductEditForm";
import { ProductHistoryTimeline } from "./ProductHistoryTimeline";
import { ProductTransactionsTable } from "./ProductTransactionsTable";
import { ProductViewMode } from "./ProductViewMode";

export function ProductDialog() {
  const {
    activeDialog,
    setActiveDialog,
    dialogMessages,
    softDeleteProductMutation,
    permanentDeleteProductMutation,
    restoreProductMutation,
    productMutation
  } = useProductDialog();

  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const actionType = useProductsStore((state) => state.actionType);
  const dialogMode = useProductsStore((state) => state.dialogMode);
  const setDialogMode = useProductsStore((state) => state.setDialogMode);
  const initialTab = useProductsStore((state) => state.initialTab);
  const setInitialTab = useProductsStore((state) => state.setInitialTab);
  const formDataState = useProductsStore((state) => state.formDataState);
  const productName = formDataState.name;
  const productId = useProductsStore((state) => state.productId);

  const [activeTab, setActiveTab] = useState(initialTab);

  const isEditMode = dialogMode === DIALOG_MODE.EDIT;
  const isViewMode = dialogMode === DIALOG_MODE.VIEW;
  const isAddMode = actionType === ACTION_TYPE.ADD;

  // fetch fresh product data for edit/view mode
  const {
    isLoading: isProductLoading,
    isError: isProductError,
    error: productError,
    refetch: refetchProduct
  } = useProductFetch(productId, !isAddMode);

  // add mode always shows edit form
  const showEditForm = isEditMode || isAddMode;

  return (
    <Dialog
      open={openProductDialog}
      onOpenChange={() => {
        setInitialTab(INITIAL_TAB.INFO);
        setOpenProductDialog();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          if (actionType === ACTION_TYPE.BILLING_PAGE_EDIT || actionType === ACTION_TYPE.EDIT) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (productMutation.isPending) e.preventDefault();
        }}
        onKeyDownCapture={(e) => {
          if (productMutation.isPending) e.preventDefault();
        }}
        className="flex h-[88vh] max-h-screen w-full min-w-7xl flex-col overflow-hidden p-0"
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as InitialTab)}
          className="flex h-full flex-col gap-0"
        >
          <div className="border-border/50 bg-background/50 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-7 py-3 backdrop-blur-md">
            <div className="min-w-0 pr-2">
              <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                {isAddMode ? "New Product" : productName || "Product Details"}
              </h2>
              {!isAddMode && (
                <>
                  {formDataState.isDeleted ? (
                    <div className="text-destructive mt-0.5 flex items-center gap-1.5 text-[0.8rem] font-semibold">
                      <span className="bg-destructive h-1.5 w-1.5 animate-pulse rounded-full" />
                      <span>
                        {formDataState.deletedAt
                          ? `Deleted on ${formatDateStrToISTDateTimeStr(formDataState.deletedAt)}`
                          : "Deleted"}
                      </span>
                    </div>
                  ) : formDataState.isDisabled ? (
                    <div className="text-destructive mt-0.5 flex items-center gap-1.5 text-[0.8rem] font-semibold">
                      <span className="bg-destructive h-1.5 w-1.5 animate-pulse rounded-full" />
                      <span>
                        {formDataState.disabledAt
                          ? `Disabled on ${formatDateStrToISTDateTimeStr(formDataState.disabledAt)}`
                          : "Disabled"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground mt-0.5 truncate text-[0.8rem]">
                      {isViewMode ? "Viewing details" : "Editing"}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex shrink-0 justify-center">
              <TabsList className="bg-secondary/40 border-border/40 flex h-auto w-full gap-1 rounded-3xl border p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] sm:w-fit">
                <TabsTrigger
                  value={INITIAL_TAB.INFO}
                  className="data-[state=active]:text-foreground data-[state=active]:bg-background ring-offset-background text-muted-foreground group relative flex-1 rounded-full px-5 py-2 text-[0.95rem] font-bold tracking-wide transition-all data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-none"
                >
                  <Info className="text-muted-foreground/50 group-data-[state=active]:text-foreground mr-2 h-4 w-4 transition-colors" />
                  Product Info
                </TabsTrigger>
                <TabsTrigger
                  value={INITIAL_TAB.HISTORY}
                  className="data-[state=active]:text-foreground data-[state=active]:bg-background ring-offset-background text-muted-foreground group relative flex-1 rounded-full px-5 py-2 text-[0.95rem] font-bold tracking-wide transition-all data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-none"
                >
                  <Clock className="text-muted-foreground/50 group-data-[state=active]:text-foreground mr-2 h-4 w-4 transition-colors" />
                  History
                </TabsTrigger>
                <TabsTrigger
                  value={INITIAL_TAB.TRANSACTIONS}
                  className="data-[state=active]:text-foreground data-[state=active]:bg-background ring-offset-background text-muted-foreground group relative flex-1 rounded-full px-5 py-2 text-[0.95rem] font-bold tracking-wide transition-all data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-none"
                >
                  <ReceiptText className="text-muted-foreground/50 group-data-[state=active]:text-foreground mr-2 h-4 w-4 transition-colors" />
                  Transactions
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex min-w-0 items-center justify-end gap-3 pl-2">
              {!isAddMode && activeTab === INITIAL_TAB.INFO && (
                <>
                  {isViewMode ? (
                    <>
                      {formDataState.isDeleted ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                onClick={() => setActiveDialog(PRODUCT_OPERATION.RESTORE)}
                                className="text-success border-success/30 hover:bg-success/10 h-10 cursor-pointer gap-2 px-5 text-sm font-semibold transition-all duration-160 ease-out active:scale-[0.97]"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Restore
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-base">Restore to active inventory</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                onClick={() => setActiveDialog(PRODUCT_OPERATION.PERMANENT_DELETE)}
                                className="border-destructive/30 text-destructive hover:bg-destructive/10 h-10 cursor-pointer gap-2 px-4 text-sm font-semibold transition-all duration-160 ease-out active:scale-[0.97]"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-base">Permanently remove from database</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setDialogMode(DIALOG_MODE.EDIT)}
                            className="border-border text-foreground hover:bg-secondary h-10 cursor-pointer gap-2 px-5 text-sm font-semibold transition-all duration-160 ease-out active:scale-[0.97]"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setActiveDialog(PRODUCT_OPERATION.SOFT_DELETE)}
                            className="border-destructive/30 text-destructive hover:bg-destructive/10 h-10 cursor-pointer gap-2 px-4 text-sm font-semibold transition-all duration-160 ease-out active:scale-[0.97]"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setDialogMode(DIALOG_MODE.VIEW)}
                      disabled={productMutation.isPending}
                      className="text-muted-foreground hover:text-foreground hover:bg-secondary h-10 cursor-pointer gap-2 px-4 text-sm font-semibold transition-all duration-160 ease-out active:scale-[0.97]"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  )}
                </>
              )}

              <Button
                variant="ghost"
                onClick={() => {
                  setInitialTab(INITIAL_TAB.INFO);
                  setOpenProductDialog();
                }}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary h-10 w-10 shrink-0 cursor-pointer p-0 transition-all duration-160 ease-out active:scale-[0.97]"
              >
                <X className="h-6! w-6!" />
              </Button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col">
            <TabsContent value={INITIAL_TAB.INFO} className="mt-0 min-h-0 flex-1">
              {!isAddMode && isProductLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col items-center justify-center gap-4"
                >
                  <LoaderCircle className="text-primary h-10 w-10 animate-spin" />
                  <p className="text-muted-foreground text-base font-medium">
                    Loading product details…
                  </p>
                </motion.div>
              ) : !isAddMode && isProductError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-full flex-col items-center justify-center gap-4"
                >
                  <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-2xl">
                    <AlertTriangle className="text-destructive h-8 w-8" />
                  </div>
                  <h3 className="text-foreground text-lg font-semibold">Failed to load product</h3>
                  <p className="text-muted-foreground max-w-sm text-center text-sm">
                    {productError?.message || "Something went wrong. Please try again."}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => refetchProduct()}
                    className="cursor-pointer gap-2 text-sm font-semibold"
                  >
                    Try Again
                  </Button>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  {showEditForm ? (
                    <motion.div
                      key="edit-split"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="flex h-full min-h-0"
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}
                        className="border-border bg-background-secondary hidden w-[35%] shrink-0 overflow-y-auto border-r p-7 md:block"
                      >
                        <ProductPreview />
                      </motion.div>

                      <div className="flex min-h-0 flex-1 flex-col p-6">
                        <ProductEditForm />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="view" className="h-full overflow-y-auto px-7 py-6">
                      <ProductViewMode />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent
              value={INITIAL_TAB.HISTORY}
              className="relative mt-0 min-h-0 flex-1 overflow-hidden"
            >
              {isAddMode ? (
                <PlaceholderTab
                  icon={<Clock className="h-8 w-8" />}
                  title="No History Available"
                  description="This product hasn't been created yet. Save it first to start tracking changes."
                />
              ) : (
                <ProductHistoryTimeline />
              )}
            </TabsContent>

            <TabsContent
              value={INITIAL_TAB.TRANSACTIONS}
              className="mt-0 flex h-full min-h-0 flex-1 flex-col overflow-hidden"
            >
              {isAddMode ? (
                <PlaceholderTab
                  icon={<ReceiptText className="h-8 w-8" />}
                  title="No Transactions Yet"
                  description="This product hasn't been created yet. Save it first to view transaction history."
                />
              ) : (
                <ProductTransactionsTable />
              )}
            </TabsContent>
          </div>
        </Tabs>

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
                onClick={() => productId && softDeleteProductMutation.mutate(productId)}
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
                onClick={() => productId && permanentDeleteProductMutation.mutate(productId)}
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
                onClick={() => productId && restoreProductMutation.mutate(productId)}
                disabled={restoreProductMutation.isPending}
              >
                {restoreProductMutation.isPending ? "Restoring..." : "Restore"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

function PlaceholderTab({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className="bg-secondary text-muted-foreground mb-5 flex h-20 w-20 items-center justify-center rounded-2xl">
        {icon}
      </div>
      <h3 className="text-foreground mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-base">{description}</p>
    </motion.div>
  );
}
