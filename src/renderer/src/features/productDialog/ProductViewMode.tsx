import { formatDateStr } from "@shared/utils/dateUtils";
import { generateProductSnapshot } from "@shared/utils/productSnapshot";
import { formatToRupees, fromMilliUnits } from "@shared/utils/utils";
import { Check, Copy, ImageOff } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { StatusIndicator } from "./StatusIndicator";
import { PROTOCOL_NAME } from "@/constants";
import { useProductsStore } from "@/store/productsStore";

export const ProductViewMode = () => {
  const formData = useProductsStore((state) => state.formDataState);
  const productId = useProductsStore((state) => state.productId);
  const displayPrice = formData.price ? formatToRupees(Number(formData.price) * 100) : "N/A";
  const displayMrp = formData.mrp ? formatToRupees(Number(formData.mrp) * 100) : null;
  const displayPurchasePrice = formData.purchasePrice
    ? formatToRupees(Number(formData.purchasePrice) * 100)
    : null;
  const productSnapshot = generateProductSnapshot({
    name: formData.name,
    weight: formData.weight,
    unit: formData.unit,
    mrp: formData.mrp ? parseFloat(formData.mrp) : 0
  });

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
              src={`${PROTOCOL_NAME}${formData.imageUrl}`}
              alt={formData.name || "Product-Image"}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <ImageOff className="text-muted-foreground/40 h-12 w-12" strokeWidth={1.5} />
              <span className="text-muted-foreground/70 text-sm font-medium tracking-wide">
                No image available
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <StatusIndicator isDisabled={formData.isDisabled} size="lg" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <h3 className="text-foreground truncate text-4xl font-extrabold tracking-tight">
            {productSnapshot || "Untitled Product"}
          </h3>
        </div>

        <DataField
          label="Product Name"
          value={formData.name || "—"}
          valueClassName="text-xl font-bold"
          className="sm:col-span-2"
        />

        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
          <DataField
            label="Selling Price"
            value={displayPrice}
            valueClassName="text-2xl font-black tracking-tight"
          />
          <DataField
            label="Purchase Price"
            value={displayPurchasePrice || "—"}
            valueClassName="text-lg font-bold"
          />
          <DataField label="MRP" value={displayMrp || "—"} valueClassName="text-lg font-bold" />
        </div>

        <DataField
          label="Weight & Unit"
          value={
            formData.weight && formData.unit && formData.unit !== "none"
              ? `${formData.weight} ${formData.unit}`
              : "—"
          }
          valueClassName="text-lg font-semibold"
        />

        <div className="bg-secondary/10 border-border/50 mt-1 rounded-2xl border px-5 py-2">
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

function DataField({
  label,
  value,
  valueClassName = "text-lg font-semibold",
  className = ""
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {label}
      </span>
      <span className={`text-foreground ${valueClassName}`} style={{ overflowWrap: "anywhere" }}>
        {value}
      </span>
    </div>
  );
}

export const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-muted-foreground shrink-0 text-base font-medium">{label}</span>
      <span className="text-foreground wrap-break-words max-w-[60%] text-right text-base font-semibold">
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
