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
  const {
    openProductDialog,
    setOpenProductDialog,
    actionType,
    showDeleteConfirm,
    setShowDeleteConfirm,
    productId,
    formDataState,
    dirtyFields,
    deleteProductMutation,
    handleSubmit,
    handleInputChange,
    errors,
    productMutation
  } = useProductDialog();

  const dialogMode = useProductsStore((state) => state.dialogMode);
  const setDialogMode = useProductsStore((state) => state.setDialogMode);

  const [activeTab, setActiveTab] = useState("info");

  const isEditMode = dialogMode === "edit";
  const isViewMode = dialogMode === "view";
  const isAddMode = actionType === "add";

  // add mode always shows edit form
  const showEditForm = isEditMode || isAddMode;

  return (
    <Dialog open={openProductDialog} onOpenChange={setOpenProductDialog}>
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
        className="flex h-[92vh] max-h-screen w-full min-w-7xl flex-col overflow-hidden p-0"
      >
        <div className="flex h-full flex-col">
          <div className="border-border flex shrink-0 items-center justify-between border-b px-7 py-4">
            <div>
              <h2 className="text-foreground text-2xl font-bold tracking-tight">
                {isAddMode ? "New Product" : formDataState.name || "Product Details"}
              </h2>
              {!isAddMode && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {isViewMode ? "Viewing product details" : "Editing product"}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
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
                        Edit Product
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 h-10 cursor-pointer gap-2 px-4 text-sm font-semibold transition-all duration-160 ease-out active:scale-[0.97]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
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
                onClick={() => setOpenProductDialog()}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary h-10 w-10 cursor-pointer p-0 transition-all duration-160 ease-out active:scale-[0.97]"
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
                productId={productId}
              />
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full min-h-0 flex-col"
          >
            <div className="border-border/40 bg-card/30 flex shrink-0 justify-center border-b px-7 py-3 backdrop-blur-lg">
              <TabsList className="bg-secondary/40 border-border/40 flex h-auto w-full max-w-xl gap-1 rounded-3xl border p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] sm:w-fit">
                <TabsTrigger
                  value="info"
                  className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background ring-offset-background group relative flex-1 rounded-full px-5 py-2 text-[0.95rem] font-bold tracking-wide transition-all data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-none"
                >
                  <Info className="text-muted-foreground/50 group-data-[state=active]:text-foreground mr-2 h-5 w-5 transition-colors" />
                  Product Info
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background ring-offset-background group relative flex-1 rounded-full px-5 py-2 text-[0.95rem] font-bold tracking-wide transition-all data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-none"
                >
                  <Clock className="text-muted-foreground/50 group-data-[state=active]:text-foreground mr-2 h-5 w-5 transition-colors" />
                  Version History
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background ring-offset-background group relative flex-1 rounded-full px-5 py-2 text-[0.95rem] font-bold tracking-wide transition-all data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-none"
                >
                  <ReceiptText className="text-muted-foreground/50 group-data-[state=active]:text-foreground mr-2 h-5 w-5 transition-colors" />
                  Transactions
                </TabsTrigger>
              </TabsList>
            </div>

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
                      <ProductPreview formData={formDataState} />
                    </motion.div>

                    <div className="flex min-h-0 flex-1 flex-col p-7">
                      <ProductEditForm
                        formDataState={formDataState}
                        handleInputChange={handleInputChange}
                        errors={errors}
                        actionType={actionType}
                        productMutation={productMutation}
                        setOpenProductDialog={setOpenProductDialog}
                        handleSubmit={handleSubmit}
                        dirtyFields={dirtyFields}
                        setDialogMode={setDialogMode}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="view" className="h-full overflow-y-auto px-7 py-6">
                    <ProductViewMode formData={formDataState} productId={productId} />
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="history" className="relative mt-0 min-h-0 flex-1 overflow-hidden">
              <ProductHistoryTimeline productId={productId} />
            </TabsContent>

            <TabsContent value="transactions" className="mt-0 min-h-0 flex-1">
              <PlaceholderTab
                icon={<ReceiptText className="h-8 w-8" />}
                title="Transactions"
                description="View all invoices where this product was sold — coming soon"
              />
            </TabsContent>
          </Tabs>
        </div>
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
