import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductDialog } from "@/hooks/products/useProductDialog";
import { useProductsStore } from "@/store/productsStore";
import { Clock, Edit3, Eye, Info, ReceiptText, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DeleteConfirmation } from "./DeleteConformation";
import { ProductEditForm, ProductPreview } from "./ProductEditForm";
import { ProductHistoryTimeline } from "./ProductHistoryTimeline";
import { ProductViewMode } from "./ProductViewMode";

export function ProductDialog() {
  const { showDeleteConfirm, setShowDeleteConfirm, deleteProductMutation, productMutation } =
    useProductDialog();

  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const actionType = useProductsStore((state) => state.actionType);
  const dialogMode = useProductsStore((state) => state.dialogMode);
  const setDialogMode = useProductsStore((state) => state.setDialogMode);
  const initialTab = useProductsStore((state) => state.initialTab);
  const setInitialTab = useProductsStore((state) => state.setInitialTab);
  const productName = useProductsStore((state) => state.formDataState.name);

  const [activeTab, setActiveTab] = useState(initialTab);

  const isEditMode = dialogMode === "edit";
  const isViewMode = dialogMode === "view";
  const isAddMode = actionType === "add";

  // add mode always shows edit form
  const showEditForm = isEditMode || isAddMode;

  return (
    <Dialog
      open={openProductDialog}
      onOpenChange={() => {
        setInitialTab("info");
        setOpenProductDialog();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          if (actionType === "billing-page-edit" || actionType === "edit") {
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
          onValueChange={(v) => setActiveTab(v as "info" | "history" | "transactions")}
          className="flex h-full flex-col"
        >
          <div className="border-border/50 bg-background/50 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-7 py-3 backdrop-blur-md">
            <div className="min-w-0 pr-2">
              <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                {isAddMode ? "New Product" : productName || "Product Details"}
              </h2>
              {!isAddMode && (
                <p className="text-muted-foreground mt-0.5 truncate text-[0.8rem]">
                  {isViewMode ? "Viewing details" : "Editing"}
                </p>
              )}
            </div>

            <div className="flex shrink-0 justify-center">
              <TabsList className="bg-secondary/40 border-border/40 flex h-auto w-full gap-1 rounded-3xl border p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] sm:w-fit">
                <TabsTrigger
                  value="info"
                  className="data-[state=active]:text-foreground data-[state=active]:bg-background ring-offset-background text-muted-foreground group relative flex-1 rounded-full px-5 py-2 text-[0.95rem] font-bold tracking-wide transition-all data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-none"
                >
                  <Info className="text-muted-foreground/50 group-data-[state=active]:text-foreground mr-2 h-4 w-4 transition-colors" />
                  Product Info
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:text-foreground data-[state=active]:bg-background ring-offset-background text-muted-foreground group relative flex-1 rounded-full px-5 py-2 text-[0.95rem] font-bold tracking-wide transition-all data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-none"
                >
                  <Clock className="text-muted-foreground/50 group-data-[state=active]:text-foreground mr-2 h-4 w-4 transition-colors" />
                  History
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="data-[state=active]:text-foreground data-[state=active]:bg-background ring-offset-background text-muted-foreground group relative flex-1 rounded-full px-5 py-2 text-[0.95rem] font-bold tracking-wide transition-all data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-none"
                >
                  <ReceiptText className="text-muted-foreground/50 group-data-[state=active]:text-foreground mr-2 h-4 w-4 transition-colors" />
                  Transactions
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex min-w-0 items-center justify-end gap-3 pl-2">
              {!isAddMode && (
                <>
                  {isViewMode ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setDialogMode("edit")}
                        className="border-border text-foreground hover:bg-secondary h-10 cursor-pointer gap-2 px-5 text-sm font-semibold transition-all duration-160 ease-out active:scale-[0.97]"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 h-10 cursor-pointer gap-2 px-4 text-sm font-semibold transition-all duration-160 ease-out active:scale-[0.97]"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setDialogMode("view")}
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
                  setInitialTab("info");
                  setOpenProductDialog();
                }}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary h-10 w-10 shrink-0 cursor-pointer p-0 transition-all duration-160 ease-out active:scale-[0.97]"
              >
                <X className="h-6! w-6!" />
              </Button>
            </div>
          </div>

          {!isAddMode && showDeleteConfirm && (
            <div className="shrink-0 px-7 py-4">
              <DeleteConfirmation
                showDeleteConfirm={showDeleteConfirm}
                setShowDeleteConfirm={setShowDeleteConfirm}
                deleteProductMutation={deleteProductMutation}
              />
            </div>
          )}

          <div className="relative flex min-h-0 flex-1 flex-col">
            <TabsContent value="info" className="mt-0 min-h-0 flex-1">
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
                      className="border-border bg-secondary/30 hidden w-[35%] shrink-0 overflow-y-auto border-r p-7 md:block"
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
            </TabsContent>

            <TabsContent value="history" className="relative mt-0 min-h-0 flex-1 overflow-hidden">
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

            <TabsContent value="transactions" className="mt-0 min-h-0 flex-1">
              {isAddMode ? (
                <PlaceholderTab
                  icon={<ReceiptText className="h-8 w-8" />}
                  title="No Transactions Yet"
                  description="This product hasn't been created yet. Save it first to view transaction history."
                />
              ) : (
                <PlaceholderTab
                  icon={<ReceiptText className="h-8 w-8" />}
                  title="Transactions"
                  description="View all invoices where this product was sold — coming soon"
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
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
