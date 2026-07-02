import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, Scissors, Sparkles, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Area, Point } from "react-easy-crop";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import toast from "react-hot-toast";
import { getCroppedImageBlob, getFittedImageBlob, getImageAspectRatio } from "./productImageCrop";

const isSvgImage = (file: File) =>
  file.type === "image/svg+xml" || /\.(svg|svgz)$/i.test(file.name);

export const ProductImageCropSelector = ({
  imageUrl,
  pendingImagePreviewUrl,
  onImageChange
}: {
  imageUrl?: string | null;
  pendingImagePreviewUrl?: string | null;
  onImageChange: (imageChange: {
    imageUrl?: string | null;
    pendingImageBlob?: Blob | null;
    pendingImagePreviewUrl?: string | null;
  }) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [hasAdjustedCrop, setHasAdjustedCrop] = useState(false);
  const [cropAspect, setCropAspect] = useState(1);

  const hasImage = Boolean(imageUrl || pendingImagePreviewUrl);
  const selectedFileName = pendingImagePreviewUrl
    ? "Unsaved cropped image"
    : imageUrl?.split(/[/\\]/).pop() || null;

  const revokeSourceImageUrl = useCallback((url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeSourceImageUrl(sourceImageUrl);
    };
  }, [sourceImageUrl, revokeSourceImageUrl]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const resetCropper = () => {
    setSourceImageUrl((currentUrl) => {
      revokeSourceImageUrl(currentUrl);
      return null;
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setHasAdjustedCrop(false);
    setCropAspect(1);
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") || isSvgImage(file)) {
      toast.error("Please select a valid image file.");
      return;
    }

    const nextSourceImageUrl = URL.createObjectURL(file);

    setSourceImageUrl((currentUrl) => {
      revokeSourceImageUrl(currentUrl);
      return nextSourceImageUrl;
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setHasAdjustedCrop(false);

    try {
      // to get dynamic image
      setCropAspect(await getImageAspectRatio(nextSourceImageUrl));
    } catch {
      toast.error("Could not read image dimensions.");
      revokeSourceImageUrl(nextSourceImageUrl);
      resetCropper();
    }
  };

  const handleCropComplete = useCallback((_croppedArea: Area, nextCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(nextCroppedAreaPixels);
  }, []);

  const applyCrop = async () => {
    if (!sourceImageUrl) {
      return;
    }

    setIsSavingImage(true);
    try {
      const croppedImageBlob =
        hasAdjustedCrop && croppedAreaPixels
          ? await getCroppedImageBlob(sourceImageUrl, croppedAreaPixels)
          : await getFittedImageBlob(sourceImageUrl);

      const previewUrl = URL.createObjectURL(croppedImageBlob);
      revokeSourceImageUrl(pendingImagePreviewUrl ?? null);

      onImageChange({
        pendingImageBlob: croppedImageBlob,
        pendingImagePreviewUrl: previewUrl
      });
      resetCropper();
    } catch (error) {
      toast.error((error as Error).message || "Something went wrong while cropping image.");
    } finally {
      setIsSavingImage(false);
    }
  };

  return (
    <div className="w-full max-w-xl space-y-3">
      <Label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        PRODUCT IMAGE
      </Label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={openFilePicker}
          className="h-9 gap-2 font-medium shadow-sm"
        >
          {hasImage ? <Upload className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
          {hasImage ? "Change Image" : "Select Image"}
        </Button>
        <Button variant="outline" size="sm" type="button" disabled className="h-9 gap-2 opacity-55">
          <Sparkles className="h-4 w-4" />
          Remove Background
        </Button>
        {hasImage && (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => {
              revokeSourceImageUrl(pendingImagePreviewUrl ?? null);
              onImageChange({
                imageUrl: null,
                pendingImageBlob: null,
                pendingImagePreviewUrl: null
              });
              resetCropper();
            }}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 gap-1.5 px-2 text-xs font-bold tracking-wider uppercase"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>

      {selectedFileName && !sourceImageUrl && (
        <div className="text-muted-foreground text-sm font-medium break-all">
          {pendingImagePreviewUrl ? selectedFileName : `Current image: ${selectedFileName}`}
        </div>
      )}

      {sourceImageUrl && (
        <div className="border-border/60 bg-secondary/20 space-y-4 rounded-lg border p-3">
          <div className="relative h-80 overflow-hidden rounded-md bg-black">
            <Cropper
              image={sourceImageUrl}
              crop={crop}
              zoom={zoom}
              aspect={cropAspect}
              cropShape="rect"
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={(nextZoom) => {
                setHasAdjustedCrop(true);
                setZoom(nextZoom);
              }}
              onCropComplete={handleCropComplete}
              onInteractionStart={() => setHasAdjustedCrop(true)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="product-image-zoom" className="text-sm font-semibold">
                Zoom
              </Label>
              <span className="text-muted-foreground text-sm font-medium">{zoom.toFixed(1)}x</span>
            </div>
            <Input
              id="product-image-zoom"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => {
                setHasAdjustedCrop(true);
                setZoom(Number(event.target.value));
              }}
              className="h-2 p-0"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetCropper} disabled={isSavingImage}>
              Cancel
            </Button>
            <Button type="button" onClick={applyCrop} disabled={isSavingImage}>
              <Scissors className="h-4 w-4" />
              {isSavingImage ? "Applying..." : "Apply Crop"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
