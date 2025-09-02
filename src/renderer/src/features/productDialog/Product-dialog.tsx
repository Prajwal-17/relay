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
import { useProductsStore } from "@/store/productsStore";
import { useSearchDropdownStore } from "@/store/searchDropdownStore";
import { AlertTriangle, History, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const units = ["g", "kg", "ml", "l", "pc", "none"];

export function ProductDialog() {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const actionType = useProductsStore((state) => state.actionType);
  const formData = useProductsStore((state) => state.formData);
  const setFormData = useProductsStore((state) => state.setFormData);
  const setSearchParam = useProductsStore((state) => state.setSearchParam);
  const setSearchResult = useSearchDropdownStore((state) => state.setSearchResult);
  const setDropdownSearch = useSearchDropdownStore((state) => state.setSearchParam);
  const setDropdownResult = useSearchDropdownStore((state) => state.setSearchResult);
  const setIsDropdownOpen = useSearchDropdownStore((state) => state.setIsDropdownOpen);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (action: "add" | "edit" | "billing-page-edit") => {
    try {
      if (action === "add") {
        setFormData({});
        const response = await window.productsApi.addNewProduct(formData);
        if (response.status === "success") {
          toast.success(response.data);
          setOpenProductDialog();
          setFormData({});
        } else {
          toast.error(response.error.message);
          setOpenProductDialog();
          setFormData({});
        }
      } else if (action === "edit") {
        setFormData({});
        const response = await window.productsApi.updateProduct(formData, formData.id);
        if (response.status === "success") {
          toast.success(response.data);
          setSearchResult("replace", []);
          setSearchParam("");
          setTimeout(() => {
            setSearchParam(formData.name);
          }, 350);
          setOpenProductDialog();
          setFormData({});
        } else {
          toast.error(response.error.message);
          setOpenProductDialog();
          setFormData({});
        }
      } else if (action === "billing-page-edit") {
        setFormData({});
        const response = await window.productsApi.updateProduct(formData, formData.id);
        if (response.status === "success") {
          toast.success(response.data);
          setDropdownResult("replace", []);
          setDropdownSearch("");
          setTimeout(() => {
            setDropdownSearch(formData.name);
          }, 220);
          setOpenProductDialog();
          setIsDropdownOpen();
          setFormData({});
        } else {
          toast.error(response.error.message);
          setOpenProductDialog();
          setFormData({});
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (actionType === "add") {
      setFormData({});
    }
  }, [actionType, setFormData]);

  const handleDelete = async (productId: string) => {
    try {
      const response = await window.productsApi.deleteProduct(productId);
      if (response.status === "success") {
        toast.success(response.data);
        setOpenProductDialog();
        setSearchResult("replace", []);
        setSearchParam("");
        setFormData({});
      } else {
        toast.error(response.error.message);
        setOpenProductDialog();
        setFormData({});
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Dialog open={openProductDialog} onOpenChange={setOpenProductDialog}>
        <DialogContent className="flex h-full max-h-[85vh] w-full min-w-[900px] flex-col p-0">
          <div className="flex h-full flex-col">
            <div className="p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {formData.name ? "Edit Product" : "Add New Product"}
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
                      value={formData.name}
                      onChange={(e) => setFormData({ name: e.target.value })}
                      placeholder="Enter product name"
                      className="px-4 py-6 !text-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-full space-y-2">
                        <Label htmlFor="weight" className="text-base font-semibold">
                          Weight
                        </Label>
                        <Input
                          id="weight"
                          value={formData.weight ?? ""}
                          onChange={(e) => setFormData({ weight: e.target.value })}
                          placeholder="e.g., 500"
                          className="px-4 py-6 !text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit" className="text-base font-semibold">
                          Unit
                        </Label>
                        <Select
                          value={formData.unit ?? "none"}
                          onValueChange={(value) => {
                            if (value === "none") {
                              setFormData({ unit: null, weight: null });
                            } else {
                              setFormData({ unit: value });
                            }
                          }}
                        >
                          <SelectTrigger className="h-11 text-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem className="text-base" key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-base font-semibold">
                        Purchase Price (Optional)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.purchasePrice ?? undefined}
                        onChange={(e) =>
                          setFormData({ purchasePrice: Number.parseInt(e.target.value) })
                        }
                        className="px-4 py-6 !text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-base font-semibold">
                        Selling Price *
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price || ""}
                        onChange={(e) => setFormData({ price: Number.parseInt(e.target.value) })}
                        className="px-4 py-6 !text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mrp" className="text-base font-semibold">
                        MRP (Optional)
                      </Label>
                      <Input
                        id="mrp"
                        type="number"
                        value={formData.mrp ?? undefined}
                        onChange={(e) => setFormData({ mrp: Number.parseInt(e.target.value) || 0 })}
                        className="px-4 py-6 !text-base"
                      />
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
                            {formData.isDisabled
                              ? "Product is currently inactive and hidden."
                              : "Product is currently active and visible."}
                          </p>
                        </div>
                        <Switch
                          id="status"
                          checked={!formData.isDisabled}
                          onCheckedChange={(checked) => setFormData({ isDisabled: !checked })}
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
                        <h4 className="text-lg font-semibold text-slate-900">Danger Zone</h4>

                        {!showDeleteConfirm ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="h-12 w-full justify-center gap-2 border-red-200 text-base text-red-600 hover:border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                            Delete Product
                          </Button>
                        ) : (
                          <div className="space-y-4 rounded-lg border border-red-200 bg-red-50/50 p-6">
                            <div className="flex items-start gap-4">
                              <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
                              <div className="space-y-3">
                                <p className="text-base font-semibold text-red-900">
                                  Are you sure you want to delete this product?
                                </p>
                                <p className="text-base text-red-700">
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
                                onClick={() => setShowDeleteConfirm(false)}
                                className="h-12 flex-1 text-lg"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="default"
                                onClick={() => handleDelete(formData.id)}
                                className="h-12 flex-1 text-lg"
                              >
                                Delete
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

            <div className="flex-shrink-0 border-t bg-white p-8">
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenProductDialog()}
                  className="h-12 px-8 text-base"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleSubmit(actionType)}
                  className="h-12 bg-blue-600 px-8 text-base hover:bg-blue-700"
                >
                  {actionType === "add" ? "Add Product" : "Update Product"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
