import { cn } from "@/lib/utils";
import { Image, ImageOff, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

const VARIANT_CLASSES = {
  thumbnail: "size-11 rounded-(--radius-control)",
  preview: "aspect-square w-full max-w-52 rounded-(--radius-panel)",
  detail: "aspect-square w-full max-w-64 rounded-(--radius-panel)"
} as const;

type ProductImageVariant = keyof typeof VARIANT_CLASSES;
type ProductImageState = "empty" | "loading" | "image" | "unavailable";
type ImageLoadState = "loading" | "ready" | "unavailable";

export type ProductImageProps = {
  src?: string | null;
  alt: string;
  variant?: ProductImageVariant;
  loading?: boolean;
  editHint?: string;
  className?: string;
  imageClassName?: string;
};

export function ProductImage({
  src,
  alt,
  variant = "thumbnail",
  loading = false,
  editHint,
  className,
  imageClassName
}: ProductImageProps) {
  const [loadState, setLoadState] = useState<ImageLoadState>("loading");

  useEffect(() => {
    setLoadState("loading");
  }, [src]);

  const state: ProductImageState = loading
    ? "loading"
    : !src
      ? "empty"
      : loadState === "unavailable"
        ? "unavailable"
        : loadState === "ready"
          ? "image"
          : "loading";
  const compact = variant === "thumbnail";

  return (
    <div
      role={state === "empty" || state === "unavailable" ? "img" : undefined}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        compact ? "bg-secondary" : "border-border bg-secondary border",
        state === "image" && "bg-background",
        VARIANT_CLASSES[variant],
        className
      )}
      aria-label={
        state === "empty"
          ? "No product image"
          : state === "unavailable"
            ? "Product image unavailable"
            : undefined
      }
    >
      {src && loadState !== "unavailable" && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoadState("ready")}
          onError={() => setLoadState("unavailable")}
          className={cn(
            "absolute inset-0 h-full w-full object-contain",
            loadState !== "ready" && "invisible",
            compact ? "p-0.5" : "p-1",
            imageClassName
          )}
        />
      )}

      {state === "loading" && (
        <LoaderCircle
          className={cn("text-muted-foreground animate-spin", compact ? "size-3.5" : "size-6")}
          aria-label="Loading product image"
        />
      )}
      {state === "empty" &&
        (compact ? (
          <Image className="text-muted-foreground size-4" strokeWidth={1.6} aria-hidden="true" />
        ) : (
          <div className="text-muted-foreground flex max-w-44 flex-col items-center gap-2 text-center">
            <Image className="size-8" strokeWidth={1.4} aria-hidden="true" />
            <span className="text-sm font-medium">No product image</span>
            {editHint && <span className="text-xs">{editHint}</span>}
          </div>
        ))}
      {state === "unavailable" &&
        (compact ? (
          <ImageOff className="text-warning size-4" strokeWidth={1.6} aria-hidden="true" />
        ) : (
          <div className="text-muted-foreground flex max-w-44 flex-col items-center gap-2 text-center">
            <ImageOff className="text-warning size-8" strokeWidth={1.4} aria-hidden="true" />
            <span className="text-sm font-medium">Image unavailable</span>
            <span className="text-xs">The local image file could not be opened.</span>
          </div>
        ))}
    </div>
  );
}
