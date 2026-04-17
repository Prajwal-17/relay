import { Badge } from "@/components/ui/badge";
import { ignoredWeight, PROTOCOL_NAME } from "@/constants";
import { useProductsStore } from "@/store/productsStore";
import type { ProductSearchItemDTO } from "@shared/types";
import { convertToRupees, formatToRupees, fromMilliUnits } from "@shared/utils/utils";
import { Clock, Edit, Eye, ImageOff, Trash2 } from "lucide-react";

export default function ProductListItem({ product }: { product: ProductSearchItemDTO }) {
  const setProductId = useProductsStore((state) => state.setProductId);
  const setActionType = useProductsStore((state) => state.setActionType);
  const setFormDataState = useProductsStore((state) => state.setFormDataState);
  const setOpenProductDialog = useProductsStore((state) => state.setOpenProductDialog);
  const setDialogMode = useProductsStore((state) => state.setDialogMode);
  const setInitialTab = useProductsStore((state) => state.setInitialTab);

  const showWeight =
    product.weight !== null &&
    ignoredWeight.some((w) => `${product.weight}+${product.unit}`.includes(w));

  const prepareAndOpenDialog = (
    mode: "view" | "edit",
    tab: "info" | "history" | "transactions" = "info"
  ) => {
    setActionType("edit");
    setDialogMode(mode);
    setInitialTab(tab);
    setProductId(product.id);
    setFormDataState({
      name: product.name,
      weight: product.weight,
      unit: product.unit,
      imageUrl: product.imageUrl ?? null,
      mrp: product.mrp ? convertToRupees(product.mrp, { asString: true }) : null,
      price: convertToRupees(product.price, { asString: true }),
      purchasePrice: product.purchasePrice
        ? convertToRupees(product.purchasePrice, { asString: true })
        : null,
      isDisabled: product.isDisabled,
      isDeleted: product.isDeleted,
      totalQuantitySold: product.totalQuantitySold,
      lastSoldAt: product.lastSoldAt ?? null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    });
    setOpenProductDialog();
  };

  return (
    <div className="group hover:bg-accent/50 active:bg-accent/70 flex items-center gap-5 px-5 py-3 transition-colors">
      <div className="border-border bg-muted/60 flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
        {product.imageUrl ? (
          <img
            src={`${PROTOCOL_NAME}${product.imageUrl}`}
            alt={product.name || "Product-Image"}
            className="h-full w-full object-contain"
          />
        ) : (
          <ImageOff className="text-muted-foreground/25 h-12 w-12" strokeWidth={1.5} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`text-xl leading-tight font-semibold ${product.isDeleted ? "text-muted-foreground line-through decoration-1" : "text-foreground"}`}
          >
            {product.name}
          </h3>
          {showWeight && (
            <Badge
              variant="outline"
              className="border-border bg-muted/50 text-muted-foreground rounded-full px-2.5 py-0.5 text-base font-semibold shadow-none"
            >
              {product.weight}
              {product.unit}
            </Badge>
          )}
          {product.mrp && (
            <Badge
              variant="outline"
              className="bg-product-badge-bg text-product-badge-text rounded-full border-transparent px-2.5 py-0.5 text-base font-semibold shadow-none"
            >
              MRP ₹{convertToRupees(product.mrp, { asString: true })}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 text-sm font-medium">
          {fromMilliUnits(product.totalQuantitySold ?? 0)} sold
        </p>
      </div>

      <div className="shrink-0 text-right">
        <div className="text-foreground text-2xl font-bold">{formatToRupees(product.price)}</div>
      </div>

      {!product.isDeleted && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => prepareAndOpenDialog("view")}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
            title="View"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => prepareAndOpenDialog("edit")}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
            title="Edit"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={() => prepareAndOpenDialog("view")}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
            title="Delete"
          >
            <Trash2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => prepareAndOpenDialog("view", "history")}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-[0.95]"
            title="History"
          >
            <Clock className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
