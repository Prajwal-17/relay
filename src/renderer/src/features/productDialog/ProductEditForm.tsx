import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PRODUCT_UNITS } from "@/constants";
import { useProductDialog } from "@/hooks/products/useProductDialog";
import { useProductsStore } from "@/store/productsStore";
import { formatToRupees, fromMilliUnits } from "@shared/utils/utils";
import { ImageOff, Trash2, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { StatusIndicator } from "./StatusIndicator";

export const ProductEditForm = () => {
  const formDataState = useProductsStore((state) => state.formDataState);
  const errors = useProductsStore((state) => state.errors);
  const actionType = useProductsStore((state) => state.actionType);
  const dirtyFields = useProductsStore((state) => state.dirtyFields);
  const setDialogMode = useProductsStore((state) => state.setDialogMode);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);

  const { handleInputChange, handleSubmit, productMutation } = useProductDialog();

  const openFilePicker = async () => {
    const response = await window.productsApi.openDialogAndSaveImage();
    if (response.status === "error") {
      toast.error(response.error.message);
    } else {
      handleInputChange("imageUrl", response.data.url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="flex h-full flex-col"
    >
      <div className="flex-1 overflow-y-auto pr-1 pl-1">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Product Image
              </Label>
              <div className="flex max-w-[320px] items-start gap-3">
                {formDataState.imageUrl ? (
                  <div className="flex w-full flex-col items-start gap-1">
                    <span className="text-foreground text-sm leading-snug font-semibold break-all">
                      {formDataState.imageUrl.split(/[/\\]/).pop() || formDataState.imageUrl}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => handleInputChange("imageUrl", null)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive -ml-2 h-7 gap-1.5 px-2 text-xs font-bold tracking-wider uppercase"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    type="button"
                    onClick={() => openFilePicker()}
                    className="h-10 gap-2 font-medium shadow-sm"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-3">
              <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Status
              </Label>
              <div className="bg-secondary/40 border-border/50 flex items-center gap-5 rounded-2xl border px-5 py-2 shadow-sm">
                <StatusIndicator size="lg" isDisabled={formDataState.isDisabled} />
                <div className="bg-border/80 h-6 w-px" />
                <Switch
                  id="status-top"
                  checked={!formDataState.isDisabled}
                  onCheckedChange={(checked) => handleInputChange("isDisabled", !checked)}
                  className="data-[state=checked]:bg-primary scale-110"
                />
              </div>
            </div>
          </div>

          <div className="bg-border/60 my-2 h-px w-full" />

          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">
              Product Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formDataState.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter product name"
              className="px-4 py-6 text-xl! font-semibold"
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
                  type="text"
                  value={formDataState.weight ?? ""}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  placeholder="e.g., 500"
                  className="px-4 py-6 text-lg! font-medium"
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
                  <SelectTrigger className="h-14 text-lg">
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
                type="text"
                value={formDataState.purchasePrice ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange("purchasePrice", value === "" ? null : value);
                }}
                className="px-4 py-6 text-lg! font-medium"
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
                type="text"
                value={formDataState.price ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange("price", value === "" ? null : value);
                }}
                className="px-4 py-6 text-lg! font-medium"
              />
              {errors.price && <div className="text-destructive">{errors.price}</div>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrp" className="text-base font-semibold">
                MRP (Optional)
              </Label>
              <Input
                id="mrp"
                type="text"
                value={formDataState.mrp ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange("mrp", value === "" ? null : value);
                }}
                className="px-4 py-6 text-lg! font-medium"
              />
              {errors.mrp && <div className="text-destructive">{errors.mrp}</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t pt-3">
        <div className="flex justify-end gap-4">
          {(actionType === "edit" || actionType === "billing-page-edit") && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogMode("view")}
              disabled={productMutation.isPending}
              className="h-12 cursor-pointer px-6 text-base transition-all duration-160 ease-out active:scale-[0.97] disabled:opacity-60"
            >
              Cancel
            </Button>
          )}
          {actionType === "add" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenProductDialog()}
              disabled={productMutation.isPending}
              className="h-12 cursor-pointer px-8 text-base transition-all duration-160 ease-out active:scale-[0.97] disabled:opacity-60"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={() => {
              handleSubmit(actionType as "add" | "edit" | "billing-page-edit");
            }}
            disabled={
              productMutation.isPending ||
              (actionType === "add"
                ? Object.keys(formDataState).length === 0
                : Object.keys(dirtyFields).length === 0)
            }
            className="bg-primary hover:bg-primary/80 h-12 cursor-pointer px-8 text-base font-semibold transition-all duration-160 ease-out active:scale-[0.97] disabled:opacity-60"
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
    </motion.div>
  );
};

export const ProductPreview = () => {
  const formData = useProductsStore((state) => state.formDataState);
  const displayPrice = formData.price ? formatToRupees(Number(formData.price) * 100) : "—";
  const displayMrp = formData.mrp ? formatToRupees(Number(formData.mrp) * 100) : "—";
  const displayPurchasePrice = formData.purchasePrice
    ? formatToRupees(Number(formData.purchasePrice) * 100)
    : "—";
  const weightStr =
    formData.weight && formData.unit && formData.unit !== "none"
      ? `${formData.weight} ${formData.unit}`
      : "—";
  const soldStr =
    formData.totalQuantitySold !== undefined && formData.totalQuantitySold !== null
      ? `${fromMilliUnits(formData.totalQuantitySold)} Units`
      : "—";

  // to handle long product names
  const nameSizeClass = useMemo(() => {
    const len = formData.name?.length ?? 0;
    if (len > 60) return "text-lg";
    if (len > 35) return "text-xl";
    return "text-3xl";
  }, [formData.name]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Live Preview
          </span>
        </div>
        <StatusIndicator isDisabled={formData.isDisabled} />
      </div>

      <div className="mb-5 flex justify-center">
        <div className="bg-secondary/20 border-border/40 flex aspect-square w-[85%] max-w-70 shrink-0 items-center justify-center overflow-hidden rounded-[2.5rem] border shadow-sm">
          {formData.imageUrl ? (
            <img
              src={formData.imageUrl}
              alt={formData.name || "Product"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <ImageOff className="text-muted-foreground/25 h-12 w-12" strokeWidth={1.5} />
              <span className="text-muted-foreground/40 text-xs font-medium tracking-wide">
                No image available
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 text-center">
        <h3
          className={`text-foreground px-2 font-extrabold tracking-tight ${nameSizeClass}`}
          style={{ overflowWrap: "anywhere" }}
        >
          {formData.name || (
            <span className="text-muted-foreground/60 italic">Untitled Product</span>
          )}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-y-6 px-1 text-center">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Weight & Unit
          </span>
          <span className="text-foreground text-base font-semibold">{weightStr}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Selling Price
          </span>
          <span className="text-foreground text-xl font-black">{displayPrice}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Purchase Price
          </span>
          <span className="text-foreground text-lg font-bold tracking-tight">
            {displayPurchasePrice}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            MRP
          </span>
          <span className="text-foreground text-lg font-bold tracking-tight">{displayMrp}</span>
        </div>
        <div className="col-span-2 flex flex-col gap-1.5 pt-1">
          <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
            Total Qty Sold
          </span>
          <span className="text-foreground text-base font-semibold">{soldStr}</span>
        </div>
      </div>
    </div>
  );
};
