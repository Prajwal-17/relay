import type { ProductsFormType } from "@/store/productsStore";
import { formatDateStr } from "@shared/utils/dateUtils";
import { formatToRupees, fromMilliUnits } from "@shared/utils/utils";
import { Check, Copy, Package } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { StatusIndicator } from "./StatusIndicator";

export const ProductViewMode = ({
  formData,
  productId
}: {
  formData: ProductsFormType;
  productId: string | null;
}) => {
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
      className="flex flex-col gap-9 md:flex-row md:items-start"
    >
      <div className="flex w-full shrink-0 flex-col gap-6 md:w-76">
        <div className="bg-secondary/40 border-border/60 flex aspect-square w-full items-center justify-center overflow-hidden rounded-4xl border shadow-sm">
          {formData.imageUrl ? (
            <img
              src={formData.imageUrl}
              alt={formData.name || "Product"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Package className="text-muted-foreground/30 h-20 w-20" />
              <span className="text-muted-foreground/50 text-sm font-medium">No Image</span>
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <StatusIndicator isDisabled={formData.isDisabled} size="lg" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <h3 className="text-foreground truncate text-4xl font-extrabold tracking-tight">
            {formData.name || "Untitled Product"}
          </h3>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <DataBox
              label="product name"
              value={formData.name || "—"}
              className="font-bold sm:col-span-2"
            />
            <DataBox
              label="weight"
              value={
                formData.weight && formData.unit && formData.unit !== "none"
                  ? `${formData.weight}${formData.unit}`
                  : "—"
              }
            />
            <DataBox label="purchase price" value={displayPurchasePrice || "—"} />
            <DataBox label="price" value={displayPrice} />
            <DataBox label="mrp" value={displayMrp || "—"} />
          </div>
        </div>

        <div className="bg-secondary/10 border-border/50 mt-3 rounded-2xl border px-5 py-2">
          <div className="divide-border/50 divide-y">
            <InfoRow
              label="Total Qty Sold"
              value={`${fromMilliUnits(formData.totalQuantitySold ?? 0)}`}
            />
            <InfoRow
              label="Last Sold"
              value={formData.lastSoldAt ? formatDateStr(formData.lastSoldAt) : "—"}
            />
            <InfoRow
              label="Created At"
              value={formData.createdAt ? formatDateStr(formData.createdAt) : "—"}
            />
            <InfoRow
              label="Updated At"
              value={formData.updatedAt ? formatDateStr(formData.updatedAt) : "—"}
            />
            {formData.isDisabled && formData.disabledAt && (
              <InfoRow label="Disabled At" value={formatDateStr(formData.disabledAt)} />
            )}
          </div>
        </div>

        {productId && (
          <div className="mt-1 flex justify-start">
            <CopyableId id={productId} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

function DataBox({
  label,
  value,
  className = ""
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <span className="text-muted-foreground ml-1 truncate text-[0.95rem] font-medium tracking-wide capitalize">
        {label}
      </span>
      <div className="bg-secondary/30 border-border/60 text-foreground flex min-h-13 w-full flex-wrap items-center rounded-2xl border px-5 py-2.5 text-lg font-semibold shadow-sm">
        <span className="wrap-break-words min-w-0">{value}</span>
      </div>
    </div>
  );
}

export const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-muted-foreground shrink-0 text-base font-medium">{label}</span>
      <span className="text-foreground wrap-break-words max-w-[60%] text-right text-sm font-semibold">
        {value}
      </span>
    </div>
  );
};

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
      className="text-muted-foreground hover:text-foreground flex flex-col items-end gap-1.5 transition-colors duration-150 sm:flex-row sm:items-center"
    >
      <span className="font-mono text-sm font-medium">{id}</span>
      {copied ? <Check className="text-success h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
