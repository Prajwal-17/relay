import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PRODUCT_UNITS } from "@/constants";
import { useProductDialog } from "@/hooks/products/useProductDialog";
import { AlertTriangle, History, Trash2 } from "lucide-react";

export function ProductDialog() {
  const {
    openProductDialog,
    setOpenProductDialog,
    actionType,
    showDeleteConfirm,
    setShowDeleteConfirm,
    formDataState,
    deleteProductMutation,
    setFormDataState,
    handleSubmit,
    handleInputChange,
    errors,
    productMutation
  } = useProductDialog();

  return (
    <>
      <Dialog open={openProductDialog} onOpenChange={setOpenProductDialog}>
        <DialogContent
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
          className="flex h-full max-h-[85vh] w-full min-w-[900px] flex-col p-0"
        >
          <div className="flex h-full flex-col">
            <div className="p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {actionType === "edit" || actionType === "billing-page-edit"
                    ? "Edit Product"
                    : "Add New Product"}
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-6 py-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-semibold">
                      Product Name *
                    </Label>
                    <Input
                      id="name"
                      value={formDataState.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter product name"
                      className="px-4 py-6 !text-xl font-semibold"
                    />
                    {errors.name && <div className="text-destructive">{errors.name}</div>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-full space-y-2">
                        <Label htmlFor="weight" className="text-base font-semibold">
                          Weight
                        </Label>
                        <Input
                          id="weight"
                          value={formDataState.weight ?? ""}
                          onChange={(e) => handleInputChange("weight", e.target.value)}
                          placeholder="e.g., 500"
                          className="px-4 py-6 !text-lg font-medium"
                        />
                        {errors.weight && <div className="text-destructive">{errors.weight}</div>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit" className="text-base font-semibold">
                          Unit
                        </Label>
                        <Select
                          value={formDataState.unit ?? "none"}
                          onValueChange={(value) => {
                            handleInputChange("unit", value);
                          }}
                        >
                          <SelectTrigger className="h-11 text-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_UNITS.map((unit) => (
                              <SelectItem className="text-base font-medium" key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.unit && <div className="text-destructive">{errors.unit}</div>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice" className="text-base font-semibold">
                        Purchase Price (Optional)
                      </Label>
                      <Input
                        id="purchasePrice"
                        value={formDataState.purchasePrice ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange("purchasePrice", value === "" ? null : value);
                        }}
                        className="px-4 py-6 !text-lg font-medium"
                      />
                      {errors.purchasePrice && (
                        <div className="text-destructive">{errors.purchasePrice}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-base font-semibold">
                        Selling Price *
                      </Label>
                      <Input
                        id="price"
                        value={formDataState.price ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange("price", value === "" ? null : value);
                        }}
                        className="px-4 py-6 !text-lg font-medium"
                      />
                      {errors.price && <div className="text-destructive">{errors.price}</div>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mrp" className="text-base font-semibold">
                        MRP (Optional)
                      </Label>
                      <Input
                        id="mrp"
                        value={formDataState.mrp ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleInputChange("mrp", value === "" ? null : value);
                        }}
                        className="px-4 py-6 !text-lg font-medium"
                      />
                      {errors.mrp && <div className="text-destructive">{errors.mrp}</div>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-foreground text-base font-semibold">Product Settings</h4>

                      <div className="flex items-center justify-between rounded-lg border bg-slate-50/50 p-4">
                        <div className="space-y-1">
                          <Label htmlFor="status" className="text-base font-semibold">
                            Product Status
                          </Label>
                          <p className="text-base text-slate-600">
                            {formDataState.isDisabled
                              ? "Product is currently inactive and hidden."
                              : "Product is currently active and visible."}
                          </p>
                        </div>
                        <Switch
                          id="status"
                          checked={!formDataState.isDisabled}
                          onCheckedChange={(checked) => setFormDataState({ isDisabled: !checked })}
                          className="scale-125"
                        />
                      </div>
                    </div>
                  </div>

                  {actionType === "edit" && (
                    <div className="flex items-center justify-between rounded-lg border bg-slate-50/50 p-6">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-3 text-base font-semibold">
                          <History className="h-5 w-5" />
                          Version History
                        </Label>
                        <p className="text-base text-slate-600">
                          View all changes made to this product
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        className="gap-2 px-6 py-3"
                      >
                        View History
                      </Button>
                    </div>
                  )}

                  {actionType === "edit" && (
                    <div className="space-y-4">
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="text-foreground text-lg font-semibold">Danger Zone</h4>

                        {!showDeleteConfirm ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-12 w-full justify-center gap-2 bg-transparent text-base hover:cursor-pointer disabled:opacity-60"
                          >
                            <Trash2 className="h-5 w-5" />
                            Delete Product
                          </Button>
                        ) : (
                          <div className="border-destructive bg-card text-card-foreground space-y-4 rounded-lg border p-6">
                            <div className="flex items-start gap-4">
                              <AlertTriangle className="text-destructive mt-0.5 h-6 w-6 flex-shrink-0" />
                              <div className="space-y-3">
                                <p className="text-destructive text-base font-semibold">
                                  Are you sure you want to delete this product?
                                </p>
                                <p className="text-muted-foreground text-base">
                                  This action cannot be undone. The product will be permanently
                                  removed from your inventory.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="default"
                                disabled={deleteProductMutation.isPending}
                                onClick={() => setShowDeleteConfirm(false)}
                                className="text-foreground border-border hover:bg-muted h-12 flex-1 cursor-pointer text-lg disabled:opacity-60"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="default"
                                disabled={deleteProductMutation.isPending}
                                onClick={() => {
                                  deleteProductMutation.mutate(formDataState.id);
                                }}
                                className="bg-destructive text-destructive-foreground h-12 flex-1 cursor-pointer text-lg hover:opacity-90 disabled:opacity-60"
                              >
                                {deleteProductMutation.isPending
                                  ? "Deleting Product..."
                                  : "Delete Product"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 border-t p-8">
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenProductDialog()}
                  disabled={productMutation.isPending}
                  className="h-12 cursor-pointer px-8 text-base disabled:opacity-60"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleSubmit(actionType);
                  }}
                  disabled={productMutation.isPending}
                  className="bg-primary hover:bg-primary/80 h-12 cursor-pointer px-8 text-base disabled:opacity-60"
                >
                  {productMutation.isPending
                    ? actionType === "add"
                      ? "Adding Product..."
                      : "Updating Product..."
                    : actionType === "add"
                      ? "Add Product"
                      : "Update Product"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
