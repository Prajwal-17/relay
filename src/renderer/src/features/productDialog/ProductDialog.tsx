import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCT_UNITS } from "@/constants";
import { useProductDialog } from "@/hooks/products/useProductDialog";
import { type ProductsFormType, useProductsStore } from "@/store/productsStore";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatToRupees, fromMilliUnits } from "@shared/utils/utils";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Edit3,
  Eye,
  Image as ImageIcon,
  Info,
  Package,
  ReceiptText,
  Trash2,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import toast from "react-hot-toast";

// ─── Copyable ID ────────────────────────────────────────────────────────────────

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 transition-colors duration-150"
      title="Copy product ID"
    >
      <span className="font-mono text-xs">{id}</span>
      {copied ? (
        <Check className="text-success h-3 w-3" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}

// ─── Status Indicator ───────────────────────────────────────────────────────────

function StatusIndicator({
  isDisabled,
  size = "default"
}: {
  isDisabled?: boolean;
  size?: "default" | "lg";
}) {
  const isLarge = size === "lg";
  if (isDisabled) {
    return (
      <div className="flex items-center gap-2">
        <div className={`rounded-full bg-orange-400 ${isLarge ? "h-2.5 w-2.5" : "h-2 w-2"}`} />
        <span className={`font-semibold text-orange-600 ${isLarge ? "text-base" : "text-sm"}`}>
          Inactive
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div
        className={`animate-pulse rounded-full bg-emerald-500 ${isLarge ? "h-2.5 w-2.5" : "h-2 w-2"}`}
      />
      <span className={`text-success font-semibold ${isLarge ? "text-base" : "text-sm"}`}>
        Active
      </span>
    </div>
  );
}

// ─── Info Row — compact label: value ────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="text-foreground text-right text-sm font-semibold">{value}</span>
    </div>
  );
}

// ─── Product View Mode ──────────────────────────────────────────────────────────

function ProductViewMode({
  formData,
  productId
}: {
  formData: ProductsFormType;
  productId: string | null;
}) {
  const displayPrice = formData.price ? formatToRupees(Number(formData.price) * 100) : "—";
  const displayMrp = formData.mrp ? formatToRupees(Number(formData.mrp) * 100) : null;
  const displayPurchasePrice = formData.purchasePrice
    ? formatToRupees(Number(formData.purchasePrice) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-5"
    >
      {/* ID */}
      {productId && <CopyableId id={productId} />}

      {/* Image */}
      <div className="bg-secondary border-border flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border">
        {formData.imageUrl ? (
          <img src={formData.imageUrl} alt={formData.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="text-muted-foreground h-10 w-10 opacity-25" />
        )}
      </div>

      {/* Name */}
      <h3 className="text-foreground text-2xl font-bold">{formData.name}</h3>

      {/* All fields — compact label: value */}
      <div className="divide-border divide-y">
        <InfoRow label="Product Snapshot" value={formData.name} />
        <InfoRow label="Selling Price" value={<span className="text-base font-bold">{displayPrice}</span>} />
        {displayMrp && <InfoRow label="MRP" value={displayMrp} />}
        {displayPurchasePrice && <InfoRow label="Purchase Price" value={displayPurchasePrice} />}
        <InfoRow
          label="Weight"
          value={
            formData.weight && formData.unit && formData.unit !== "none"
              ? `${formData.weight}${formData.unit}`
              : "—"
          }
        />
        <InfoRow label="Unit" value={formData.unit && formData.unit !== "none" ? formData.unit : "—"} />
        <InfoRow label="Total Qty Sold" value={`${fromMilliUnits(formData.totalQuantitySold ?? 0)}`} />
        <InfoRow
          label="Status"
          value={<StatusIndicator isDisabled={formData.isDisabled} />}
        />
        {formData.isDisabled && formData.disabledAt && (
          <InfoRow label="Disabled At" value={formatDateStr(formData.disabledAt)} />
        )}
        <InfoRow label="Last Sold" value={formData.lastSoldAt ? formatDateStr(formData.lastSoldAt) : "—"} />
        <InfoRow label="Created At" value={formData.createdAt ? formatDateStr(formData.createdAt) : "—"} />
        <InfoRow label="Updated At" value={formData.updatedAt ? formatDateStr(formData.updatedAt) : "—"} />
      </div>
    </motion.div>
  );
}

// ─── Live Preview (Edit Mode Left Panel) ────────────────────────────────────────

function ProductPreview({ formData }: { formData: ProductsFormType }) {
  const displayPrice = formData.price ? `₹${formData.price}` : "—";
  const displayMrp = formData.mrp ? `₹${formData.mrp}` : null;
  const displayPurchasePrice = formData.purchasePrice ? `₹${formData.purchasePrice}` : null;

  return (
    <div className="flex h-full flex-col">
      {/* Live Preview Badge */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Live Preview
        </span>
      </div>

      {/* Image */}
      <div className="bg-secondary border-border mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border">
        {formData.imageUrl ? (
          <img src={formData.imageUrl} alt={formData.name || "Product"} className="h-full w-full object-cover" />
        ) : (
          <Package className="text-muted-foreground h-8 w-8 opacity-25" />
        )}
      </div>

      {/* Name */}
      <h3 className="text-foreground mb-3 text-lg font-bold">
        {formData.name || <span className="text-muted-foreground italic">Untitled</span>}
      </h3>

      {/* All fields — compact */}
      <div className="divide-border divide-y text-sm">
        <InfoRow label="Price" value={<span className="font-bold">{displayPrice}</span>} />
        {displayMrp && <InfoRow label="MRP" value={displayMrp} />}
        {displayPurchasePrice && <InfoRow label="Purchase" value={displayPurchasePrice} />}
        <InfoRow
          label="Weight"
          value={
            formData.weight && formData.unit && formData.unit !== "none"
              ? `${formData.weight}${formData.unit}`
              : "—"
          }
        />
        <InfoRow label="Qty Sold" value={`${fromMilliUnits(formData.totalQuantitySold ?? 0)}`} />
        <InfoRow label="Status" value={<StatusIndicator isDisabled={formData.isDisabled} />} />
        <InfoRow label="Last Sold" value={formData.lastSoldAt ? formatDateStr(formData.lastSoldAt) : "—"} />
      </div>
    </div>
  );
}

// ─── Edit Form (Right Panel) ────────────────────────────────────────────────────

function ProductEditForm({
  formDataState,
  handleInputChange,
  errors,
  actionType,
  productMutation,
  setOpenProductDialog,
  handleSubmit,
  dirtyFields,
  setDialogMode
}: {
  formDataState: ProductsFormType;
  handleInputChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  actionType: string;
  productMutation: any;
  setOpenProductDialog: () => void;
  handleSubmit: (action: "add" | "edit" | "billing-page-edit") => void;
  dirtyFields: any;
  setDialogMode: (mode: "view" | "edheiracchyit") => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="flex h-full flex-col"
    >
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="space-y-6 py-1">
          {/* Product Name */}
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

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-base font-semibold">
              Image URL
            </Label>
            <div className="relative">
              <ImageIcon className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
              <Input
                id="imageUrl"
                type="text"
                value={formDataState.imageUrl ?? ""}
                onChange={(e) => handleInputChange("imageUrl", e.target.value || null)}
                placeholder="https://example.com/image.jpg"
                className="py-6 pr-4 pl-12 text-lg"
              />
            </div>
          </div>

          {/* Weight + Unit / Purchase Price */}
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
                  <SelectTrigger className="h-[52px] text-lg">
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

          {/* Selling Price + MRP */}
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

          {/* Product Status Toggle — Revamped */}
          <div className="space-y-4">
            <Separator />
            <h4 className="text-foreground text-base font-semibold">Product Settings</h4>
            <div className="border-border flex items-center justify-between rounded-lg border bg-slate-50/50 p-5">
              <div className="flex items-center gap-4">
                <StatusIndicator isDisabled={formDataState.isDisabled} size="lg" />
                <div className="border-border h-8 border-l" />
                <p className="text-muted-foreground text-base">
                  {formDataState.isDisabled
                    ? "Product is currently inactive and hidden from billing."
                    : "Product is currently active and visible in billing."}
                </p>
              </div>
              <Switch
                id="status"
                checked={!formDataState.isDisabled}
                onCheckedChange={(checked) => handleInputChange("isDisabled", !checked)}
                className="scale-125"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="shrink-0 border-t pt-5">
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
}

// ─── Placeholder Tab ────────────────────────────────────────────────────────────

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

// ─── Delete Confirmation ────────────────────────────────────────────────────────

function DeleteConfirmation({
  showDeleteConfirm,
  setShowDeleteConfirm,
  deleteProductMutation,
  productId
}: {
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  deleteProductMutation: any;
  productId: string | null;
}) {
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
}

// ─── Main Dialog ────────────────────────────────────────────────────────────────

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

  // Add mode always shows edit form
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
        className="flex h-[88vh] max-h-[88vh] w-full max-w-5xl min-w-225 flex-col overflow-hidden p-0"
      >
        <div className="flex h-full flex-col">
          {/* ─── Header ──────────────────────────────────────────────── */}
          <div className="border-border flex shrink-0 items-center justify-between border-b px-7 py-5">
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
              {/* Global actions — Edit / Delete / View toggle (available in all tabs) */}
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

              {/* Close button — bigger */}
              <Button
                variant="ghost"
                onClick={() => setOpenProductDialog()}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary h-10 w-10 cursor-pointer p-0 transition-all duration-160 ease-out active:scale-[0.97]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* ─── Delete Confirmation (global, below header) ───────── */}
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

          {/* ─── Tabs (only shown for existing products) ─────────── */}
          {!isAddMode ? (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex h-full min-h-0 flex-col"
            >
              <div className="border-border shrink-0 border-b px-7">
                <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0">
                  <TabsTrigger
                    value="info"
                    className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent px-5 py-3 text-base font-semibold transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    Product Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent px-5 py-3 text-base font-semibold transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Version History
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-primary relative rounded-none border-b-2 border-transparent px-5 py-3 text-base font-semibold transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <ReceiptText className="mr-2 h-4 w-4" />
                    Transactions
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ─── Product Info Tab ─────────────────────────────── */}
              <TabsContent value="info" className="mt-0 min-h-0 flex-1">
                <AnimatePresence mode="wait">
                  {showEditForm ? (
                    /* ── Edit Mode: Split Panel ───────────────────── */
                    <motion.div
                      key="edit-split"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="flex h-full min-h-0"
                    >
                      {/* Left: Live Preview */}
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}
                        className="border-border bg-secondary/30 hidden w-[42%] shrink-0 overflow-y-auto border-r p-7 md:block"
                      >
                        <ProductPreview formData={formDataState} />
                      </motion.div>

                      {/* Right: Edit Form */}
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
                    /* ── View Mode ────────────────────────────────── */
                    <motion.div key="view" className="h-full overflow-y-auto p-7">
                      <ProductViewMode formData={formDataState} productId={productId} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* ─── Version History Tab ──────────────────────────── */}
              <TabsContent value="history" className="mt-0 min-h-0 flex-1">
                <PlaceholderTab
                  icon={<Clock className="h-8 w-8" />}
                  title="Version History"
                  description="Track all changes made to this product — coming soon"
                />
              </TabsContent>

              {/* ─── Transactions Tab ─────────────────────────────── */}
              <TabsContent value="transactions" className="mt-0 min-h-0 flex-1">
                <PlaceholderTab
                  icon={<ReceiptText className="h-8 w-8" />}
                  title="Transactions"
                  description="View all invoices where this product was sold — coming soon"
                />
              </TabsContent>
            </Tabs>
          ) : (
            /* ─── Add Mode: No tabs, just the form ───────────────── */
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
