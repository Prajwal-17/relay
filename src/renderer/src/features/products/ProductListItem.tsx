import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ignoredWeight } from "@/constants";
import { useProductsStore } from "@/store/productsStore";
import type { ProductSearchItemDTO } from "@shared/types";
import { convertToRupees, formatToRupees, fromMilliUnits } from "@shared/utils/utils";
import { Clock, Edit, Eye, ImageOff, Trash2 } from "lucide-react";

type ProductListItemProps = {
  product: ProductSearchItemDTO;
};

export default function ProductListItem({ product }: ProductListItemProps) {
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
    <div className="group hover:bg-accent/50 active:bg-accent/70 flex items-center gap-5 px-5 py-4 transition-colors">
      <div className="border-border bg-muted/60 flex h-18 w-18 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
        <ImageOff className="text-muted-foreground/25 h-12 w-12" strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`text-lg leading-tight font-semibold ${product.isDeleted ? "text-muted-foreground line-through decoration-1" : "text-foreground"}`}
          >
            {product.name}
          </h3>
          {showWeight && (
            <Badge
              variant="outline"
              className="border-border bg-muted/50 text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold shadow-none"
            >
              {product.weight}
              {product.unit}
            </Badge>
          )}
          {product.mrp && (
            <Badge
              variant="outline"
              className="bg-product-badge-bg text-product-badge-text rounded-full border-transparent px-2 py-0.5 text-xs font-semibold shadow-none"
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
        <div className="text-foreground text-xl font-bold">{formatToRupees(product.price)}</div>
        {product.purchasePrice && (
          <p className="text-muted-foreground mt-0.5 text-sm font-medium">
            Purchase {formatToRupees(product.purchasePrice)}
          </p>
        )}
      </div>

      {!product.isDeleted && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-all duration-160 ease-out group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => prepareAndOpenDialog("view")}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary h-8 w-8 cursor-pointer p-0 active:scale-[0.97]"
            title="View product"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => prepareAndOpenDialog("edit")}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary h-8 w-8 cursor-pointer p-0 active:scale-[0.97]"
            title="Edit product"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => prepareAndOpenDialog("view")}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer p-0 active:scale-[0.97]"
            title="Delete product"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => prepareAndOpenDialog("view", "history")}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary h-8 w-8 cursor-pointer p-0 active:scale-[0.97]"
            title="View history"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
