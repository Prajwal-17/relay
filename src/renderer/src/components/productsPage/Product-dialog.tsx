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
import { toast } from "sonner";

const units = ["g", "kg", "ml", "l", "pcs", "bundle"];

export function ProductDialog() {
  const openProductDialog = useProductsStore((state) => state.openProductDialog);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const actionType = useProductsStore((state) => state.actionType);
  const formData = useProductsStore((state) => state.formData);
  const setFormData = useProductsStore((state) => state.setFormData);
  const setSearchParam = useProductsStore((state) => state.setSearchParam);
  const setSearchResult = useSearchDropdownStore((state) => state.setSearchResult);

  const handleSubmit = async (action: "add" | "edit") => {
    try {
      if (action === "add") {
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
        const response = await window.productsApi.updateProduct(formData, formData.id);
        if (response.status === "success") {
          toast.success(response.data);
          setSearchResult("replace", []);
          setSearchParam(formData.name);
          setOpenProductDialog();
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
                    <div className="space-y-2">
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
                        value={formData.unit ?? ""}
                        onValueChange={(value) => setFormData({ unit: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        onChange={(e) =>
                          setFormData({ price: Number.parseInt(e.target.value) || 0 })
                        }
                        placeholder="0"
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
                        value={formData.mrp || ""}
                        onChange={(e) => setFormData({ mrp: Number.parseInt(e.target.value) || 0 })}
                        placeholder="0"
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
