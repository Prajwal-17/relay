import { ProductImage } from "@/components/app-ui/product-image";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { getProductImageUrl } from "@/constants/renderer.constants";
import { cn } from "@/lib/utils";
import { Check, ImagePlus, LoaderCircle, Scissors, Trash2, Upload } from "lucide-react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Area, Point } from "react-easy-crop";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import {
  getCroppedImageBlob,
  getFittedImageBlob,
  validateProductImageBlob
} from "./productImageCrop";

type WorkspacePhase = "ready" | "loading" | "saving";

type ImageChange = {
  imageUrl?: string | null;
  pendingImageBlob?: Blob | null;
  pendingImagePreviewUrl?: string | null;
};

export const ProductImageCropSelector = ({
  imageUrl,
  pendingImageBlob,
  pendingImagePreviewUrl,
  onImageChange
}: {
  imageUrl?: string | null;
  pendingImageBlob?: Blob | null;
  pendingImagePreviewUrl?: string | null;
  onImageChange: (imageChange: ImageChange) => void;
}) => {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropUrlRef = useRef<string | null>(null);
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [hasAdjustedCrop, setHasAdjustedCrop] = useState(false);
  const [phase, setPhase] = useState<WorkspacePhase>("ready");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedPreview = pendingImagePreviewUrl
    ? pendingImagePreviewUrl
    : imageUrl
      ? getProductImageUrl(imageUrl)
      : null;
  const hasImage = Boolean(selectedPreview);
  const isBusy = phase !== "ready";

  const replaceCropUrl = useCallback((blob: Blob | null) => {
    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    const nextUrl = blob ? URL.createObjectURL(blob) : null;
    cropUrlRef.current = nextUrl;
    setCropImageUrl(nextUrl);
  }, []);

  const resetCrop = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setHasAdjustedCrop(false);
  }, []);

  const closeCropWorkspace = useCallback(() => {
    replaceCropUrl(null);
    resetCrop();
    setPhase("ready");
  }, [replaceCropUrl, resetCrop]);

  useEffect(() => {
    return () => {
      if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    };
  }, []);

  const openBlobForCrop = useCallback(
    (blob: Blob) => {
      replaceCropUrl(blob);
      resetCrop();
      setPhase("ready");
      setValidationError(null);
    },
    [replaceCropUrl, resetCrop]
  );

  const loadSelectedBlob = useCallback(async () => {
    if (originalBlob) return originalBlob;
    if (pendingImageBlob) {
      setOriginalBlob(pendingImageBlob);
      return pendingImageBlob;
    }
    if (!imageUrl) throw new Error("Choose an image first.");

    setPhase("loading");
    const response = await fetch(getProductImageUrl(imageUrl));
    if (!response.ok) throw new Error("The saved product image is unavailable.");
    const fetched = await response.blob();
    const blob =
      fetched.type === "image/webp"
        ? fetched
        : new Blob([await fetched.arrayBuffer()], { type: "image/webp" });
    await validateProductImageBlob(blob);
    setOriginalBlob(blob);
    return blob;
  }, [imageUrl, originalBlob, pendingImageBlob]);

  const selectFile = useCallback(
    async (file: File) => {
      setValidationError(null);
      setPhase("loading");
      try {
        await validateProductImageBlob(file);
        setOriginalBlob(file);
        openBlobForCrop(file);
      } catch (error) {
        setPhase("ready");
        setValidationError((error as Error).message);
      }
    },
    [openBlobForCrop]
  );

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    if (files.length !== 1) {
      event.target.value = "";
      setValidationError("Choose one image at a time.");
      return;
    }
    const file = files[0]!;
    event.target.value = "";
    await selectFile(file);
  };

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = [...event.dataTransfer.files];
    if (files.length !== 1) {
      setValidationError("Drop one image at a time.");
      return;
    }
    await selectFile(files[0]!);
  };

  const handleDropZoneKeyDown = (event: KeyboardEvent<HTMLLabelElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    fileInputRef.current?.click();
  };

  const openCropForCurrentImage = async () => {
    setValidationError(null);
    try {
      const blob = await loadSelectedBlob();
      openBlobForCrop(blob);
    } catch (error) {
      setPhase("ready");
      setValidationError((error as Error).message);
    }
  };

  const useImage = async () => {
    if (!cropImageUrl) return;
    setPhase("saving");
    setValidationError(null);
    try {
      const finalBlob =
        hasAdjustedCrop && croppedAreaPixels
          ? await getCroppedImageBlob(cropImageUrl, croppedAreaPixels)
          : await getFittedImageBlob(cropImageUrl);
      const previewUrl = URL.createObjectURL(finalBlob);
      if (pendingImagePreviewUrl) URL.revokeObjectURL(pendingImagePreviewUrl);
      onImageChange({
        pendingImageBlob: finalBlob,
        pendingImagePreviewUrl: previewUrl
      });
      closeCropWorkspace();
    } catch (error) {
      setPhase("ready");
      setValidationError((error as Error).message);
    }
  };

  const removeImage = () => {
    closeCropWorkspace();
    if (pendingImagePreviewUrl) URL.revokeObjectURL(pendingImagePreviewUrl);
    setOriginalBlob(null);
    setValidationError(null);
    onImageChange({
      imageUrl: null,
      pendingImageBlob: null,
      pendingImagePreviewUrl: null
    });
  };

  return (
    <div className="w-full max-w-xl space-y-2.5">
      <Label className="text-muted-foreground text-xs font-semibold">Product image</Label>
      <input
        id={fileInputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        className="sr-only"
        onChange={handleFileSelected}
      />

      {!hasImage && !cropImageUrl ? (
        <label
          htmlFor={fileInputId}
          role="button"
          tabIndex={0}
          onKeyDown={handleDropZoneKeyDown}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false);
          }}
          onDrop={handleDrop}
          aria-busy={phase === "loading"}
          className={cn(
            "focus-visible:ring-ring bg-secondary flex h-24 cursor-pointer items-center gap-3 rounded-(--radius-panel) border border-dashed px-3 text-left transition-[background-color,border-color] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            isDragging ? "border-focus bg-selected" : "border-frame hover:bg-hover"
          )}
        >
          <span className="border-border bg-background flex size-10 shrink-0 items-center justify-center rounded-(--radius-control) border">
            {phase === "loading" ? (
              <LoaderCircle className="text-muted-foreground size-5 animate-spin" />
            ) : (
              <ImagePlus className="text-muted-foreground size-5" strokeWidth={1.7} />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">
              {phase === "loading"
                ? "Opening image…"
                : isDragging
                  ? "Release to add image"
                  : "Drop product image here"}
            </span>
            <span className="text-muted-foreground mt-0.5 block text-xs">
              {phase === "loading"
                ? "This usually takes a moment."
                : "Or choose one from this computer."}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "bg-background pointer-events-none shrink-0"
            )}
          >
            <Upload className="size-3.5" />
            Choose image
          </span>
        </label>
      ) : (
        !cropImageUrl && (
          <div className="border-border bg-secondary flex min-h-24 items-center gap-3 rounded-(--radius-panel) border p-3">
            <ProductImage
              src={selectedPreview}
              alt="Selected product"
              className="size-18 shrink-0"
              imageClassName="p-1"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div>
                <p className="text-sm font-semibold">Image selected</p>
                <p className="text-muted-foreground text-xs">
                  Changes apply when you save the product.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openCropForCurrentImage}
                  disabled={isBusy}
                >
                  {phase === "loading" ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Scissors className="size-3.5" />
                  )}
                  {phase === "loading" ? "Opening…" : "Adjust crop"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                >
                  <Upload className="size-3.5" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeImage}
                  disabled={isBusy}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Remove image
                </Button>
              </div>
            </div>
          </div>
        )
      )}

      {cropImageUrl && (
        <div className="py-1">
          <div className="mx-auto w-full max-w-sm">
            <div className="border-frame bg-secondary relative aspect-square overflow-hidden rounded-(--radius-control) border">
              <Cropper
                image={cropImageUrl}
                crop={crop}
                zoom={zoom}
                minZoom={1}
                maxZoom={4}
                aspect={1}
                cropShape="rect"
                objectFit="contain"
                showGrid={hasAdjustedCrop}
                style={{ cropAreaStyle: { opacity: hasAdjustedCrop ? 1 : 0 } }}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
                onInteractionStart={() => setHasAdjustedCrop(true)}
              />
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Label htmlFor="product-image-zoom" className="shrink-0 text-xs font-semibold">
                Zoom
              </Label>
              <Slider
                id="product-image-zoom"
                min={1}
                max={4}
                step={0.05}
                value={[zoom]}
                aria-label="Image zoom"
                onValueChange={([nextZoom]) => {
                  const value = nextZoom ?? 1;
                  setZoom(value);
                  setHasAdjustedCrop(value > 1 || crop.x !== 0 || crop.y !== 0);
                }}
                disabled={isBusy}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-muted-foreground min-w-0 text-xs">Drag to position</p>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeCropWorkspace}
                  disabled={phase === "saving"}
                >
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={useImage} disabled={isBusy}>
                  {phase === "saving" ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  {phase === "saving" ? "Preparing…" : "Use image"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div aria-live="polite" className="min-h-5">
        {validationError && (
          <div role="alert" className="text-destructive text-xs">
            {validationError}
          </div>
        )}
      </div>
    </div>
  );
};
