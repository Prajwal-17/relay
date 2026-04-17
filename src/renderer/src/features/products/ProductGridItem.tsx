import { Button } from "@/components/ui/button";
import { ignoredWeight, PROTOCOL_NAME } from "@/constants";
import { useProductsStore } from "@/store/productsStore";
import type { ProductSearchItemDTO } from "@shared/types";
import { convertToRupees, formatToRupees, fromMilliUnits } from "@shared/utils/utils";
import { Clock, Edit, Eye, ImageOff, Trash2 } from "lucide-react";

type ProductGridItemProps = {
  product: ProductSearchItemDTO;
};

export default function ProductGridItem({ product }: ProductGridItemProps) {
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
      imageUrl: "./para20.png",
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
    <div className="group bg-card border-border relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="bg-muted/40 border-border/50 flex aspect-4/3 items-center justify-center overflow-hidden border-b">
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

      <div className="flex flex-1 flex-col p-3.5">
        <h3
          className={`line-clamp-2 text-sm leading-snug font-semibold ${product.isDeleted ? "text-muted-foreground line-through decoration-1" : "text-foreground"}`}
        >
          {product.name}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {showWeight && (
            <span className="bg-muted/60 text-muted-foreground rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold">
              {product.weight}
              {product.unit}
            </span>
          )}
          {product.mrp && (
            <span className="bg-product-badge-bg text-product-badge-text rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold">
              MRP ₹{convertToRupees(product.mrp, { asString: true })}
            </span>
          )}
          <span className="text-muted-foreground text-[0.65rem] font-medium">
            {fromMilliUnits(product.totalQuantitySold ?? 0)} sold
          </span>
        </div>

        <div className="mt-auto pt-3">
          <div className="text-foreground text-lg leading-tight font-bold">
            {formatToRupees(product.price)}
          </div>
          {product.purchasePrice && (
            <p className="text-muted-foreground mt-0.5 text-xs font-medium">
              Purchase {formatToRupees(product.purchasePrice)}
            </p>
          )}
        </div>

        <div className="border-product-divider mt-3 flex items-center justify-end border-t pt-3">
          {!product.isDeleted && (
            <div className="flex items-center gap-0.5 opacity-0 transition-all duration-160 ease-out group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => prepareAndOpenDialog("view")}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary h-7 w-7 cursor-pointer p-0 active:scale-[0.97]"
                title="View"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => prepareAndOpenDialog("edit")}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary h-7 w-7 cursor-pointer p-0 active:scale-[0.97]"
                title="Edit"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => prepareAndOpenDialog("view")}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7 cursor-pointer p-0 active:scale-[0.97]"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => prepareAndOpenDialog("view", "history")}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary h-7 w-7 cursor-pointer p-0 active:scale-[0.97]"
                title="History"
              >
                <Clock className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
