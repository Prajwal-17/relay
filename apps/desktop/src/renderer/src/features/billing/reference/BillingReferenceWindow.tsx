import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBillingTabsStore } from "@/features/billing/store/billingTabs.store";
import {
  useReferenceWindowStore,
  type ReferenceImageMetadata
} from "@/features/billing/store/referenceWindow.store";
import { cn } from "@/lib/utils";
import {
  CloudUpload,
  FileImage,
  GripVertical,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  deleteReferenceImageBlob,
  loadReferenceImageBlob,
  saveReferenceImageBlob
} from "./referenceImage.storage";

const REFERENCE_WINDOW_SIZE_KEY = "quickcart-billing-reference-window-size-v2";
const MAX_SOURCE_FILE_SIZE = 12 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1_800;
const IMAGE_QUALITY = 0.86;
const DEFAULT_WINDOW_WIDTH = 598;
const DEFAULT_WINDOW_HEIGHT = 711;
const MIN_WINDOW_WIDTH = 320;
const MIN_WINDOW_HEIGHT = 320;
const WINDOW_EDGE_GAP = 10;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;
const PAN_STEP = 32;

type Point = { x: number; y: number };
type Size = { width: number; height: number };
type WindowFrame = Point & Size;

type ProcessedReferenceImage = {
  blob: Blob;
  width: number;
  height: number;
};

type WindowInteraction = {
  mode: "move" | "resize";
  startClientX: number;
  startClientY: number;
  startFrame: WindowFrame;
};

type ImageInteraction = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPan: Point;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const readWindowSize = (): Size => {
  try {
    const savedSize = window.localStorage.getItem(REFERENCE_WINDOW_SIZE_KEY);
    if (!savedSize) {
      return { width: DEFAULT_WINDOW_WIDTH, height: DEFAULT_WINDOW_HEIGHT };
    }

    const parsed = JSON.parse(savedSize) as Partial<Size>;
    return {
      width:
        typeof parsed.width === "number" && Number.isFinite(parsed.width)
          ? parsed.width
          : DEFAULT_WINDOW_WIDTH,
      height:
        typeof parsed.height === "number" && Number.isFinite(parsed.height)
          ? parsed.height
          : DEFAULT_WINDOW_HEIGHT
    };
  } catch {
    return { width: DEFAULT_WINDOW_WIDTH, height: DEFAULT_WINDOW_HEIGHT };
  }
};

const saveWindowSize = ({ width, height }: Size) => {
  try {
    window.localStorage.setItem(
      REFERENCE_WINDOW_SIZE_KEY,
      JSON.stringify({ width: Math.round(width), height: Math.round(height) })
    );
  } catch {
    // The resize remains usable even when browser storage is unavailable.
  }
};

const createCanvasBlob = (canvas: HTMLCanvasElement, mimeType: string): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, mimeType, IMAGE_QUALITY));

const processImageFile = (file: File): Promise<ProcessedReferenceImage> =>
  new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = document.createElement("img");

    image.onload = async () => {
      URL.revokeObjectURL(sourceUrl);

      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("The image could not be prepared for viewing."));
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      try {
        const webpBlob = await createCanvasBlob(canvas, "image/webp");
        const blob =
          webpBlob?.type === "image/webp" ? webpBlob : await createCanvasBlob(canvas, "image/jpeg");
        if (!blob) {
          reject(new Error("The image could not be prepared for viewing."));
          return;
        }
        resolve({ blob, width, height });
      } catch {
        reject(new Error("The image could not be prepared for viewing."));
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error("That image could not be opened. Try another image."));
    };

    image.src = sourceUrl;
  });

const getScreenSize = (): Size => ({
  width: window.innerWidth,
  height: window.innerHeight
});

const clampWindowFrame = (frame: WindowFrame, screen: Size): WindowFrame => {
  const availableWidth = Math.max(1, screen.width - WINDOW_EDGE_GAP * 2);
  const availableHeight = Math.max(1, screen.height - WINDOW_EDGE_GAP * 2);
  const minimumWidth = Math.min(MIN_WINDOW_WIDTH, availableWidth);
  const minimumHeight = Math.min(MIN_WINDOW_HEIGHT, availableHeight);
  const width = clamp(frame.width, minimumWidth, availableWidth);
  const height = clamp(frame.height, minimumHeight, availableHeight);

  return {
    width,
    height,
    x: clamp(
      frame.x,
      WINDOW_EDGE_GAP,
      Math.max(WINDOW_EDGE_GAP, screen.width - width - WINDOW_EDGE_GAP)
    ),
    y: clamp(
      frame.y,
      WINDOW_EDGE_GAP,
      Math.max(WINDOW_EDGE_GAP, screen.height - height - WINDOW_EDGE_GAP)
    )
  };
};

const BillingReferenceWindow = () => {
  const activeTabId = useBillingTabsStore((state) => state.activeTabId);
  const isOpen = useReferenceWindowStore((state) => state.isOpen);
  const setOpen = useReferenceWindowStore((state) => state.setOpen);
  const referenceImage = useReferenceWindowStore((state) =>
    activeTabId ? (state.imageMetadataByTabId[activeTabId] ?? null) : null
  );
  const setImageMetadata = useReferenceWindowStore((state) => state.setImageMetadata);
  const removeImageMetadata = useReferenceWindowStore((state) => state.removeImageMetadata);

  const storedWindowSize = useMemo(readWindowSize, []);
  const [windowFrame, setWindowFrame] = useState<WindowFrame>({
    x: WINDOW_EDGE_GAP,
    y: WINDOW_EDGE_GAP,
    width: storedWindowSize.width,
    height: storedWindowSize.height
  });
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [isLoadingStoredImage, setIsLoadingStoredImage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState<Size>({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowInteractionRef = useRef<WindowInteraction | null>(null);
  const imageInteractionRef = useRef<ImageInteraction | null>(null);
  const screenDragDepthRef = useRef(0);
  const didPlaceWindowRef = useRef(false);
  const referenceImageUrlRef = useRef<string | null>(null);

  const setReferenceImageBlob = useCallback((blob: Blob | null) => {
    if (referenceImageUrlRef.current) {
      URL.revokeObjectURL(referenceImageUrlRef.current);
    }
    const nextUrl = blob ? URL.createObjectURL(blob) : null;
    referenceImageUrlRef.current = nextUrl;
    setReferenceImageUrl(nextUrl);
  }, []);

  useEffect(() => {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
    setIsFileDragging(false);
  }, [activeTabId]);

  useEffect(() => {
    let cancelled = false;
    setReferenceImageBlob(null);

    if (!isOpen || !activeTabId || !referenceImage) {
      setIsLoadingStoredImage(false);
      return;
    }

    setIsLoadingStoredImage(true);
    void loadReferenceImageBlob(referenceImage.blobId)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          removeImageMetadata(activeTabId);
          toast.error("The stored item list image could not be found.");
          return;
        }
        setReferenceImageBlob(blob);
      })
      .catch((error) => {
        if (cancelled) return;
        removeImageMetadata(activeTabId);
        toast.error(error instanceof Error ? error.message : "The stored image could not load.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStoredImage(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTabId, isOpen, referenceImage, removeImageMetadata, setReferenceImageBlob]);

  useEffect(
    () => () => {
      useReferenceWindowStore.getState().setOpen(false);
      if (referenceImageUrlRef.current) {
        URL.revokeObjectURL(referenceImageUrlRef.current);
        referenceImageUrlRef.current = null;
      }
    },
    []
  );

  useLayoutEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const screen = getScreenSize();

    const shouldPlaceWindow = !didPlaceWindowRef.current;
    didPlaceWindowRef.current = true;
    setWindowFrame((current) => {
      const candidate = shouldPlaceWindow
        ? {
            ...current,
            x: screen.width - current.width - WINDOW_EDGE_GAP,
            y: WINDOW_EDGE_GAP
          }
        : current;
      return clampWindowFrame(candidate, screen);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      setWindowFrame((current) => clampWindowFrame(current, getScreenSize()));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !referenceImage || !viewportRef.current) return;
    const viewport = viewportRef.current;
    const updateSize = () => {
      setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [isOpen, referenceImage]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const interaction = windowInteractionRef.current;
      if (!interaction || !panelRef.current) return;
      const screen = getScreenSize();

      const deltaX = event.clientX - interaction.startClientX;
      const deltaY = event.clientY - interaction.startClientY;

      if (interaction.mode === "move") {
        setWindowFrame(
          clampWindowFrame(
            {
              ...interaction.startFrame,
              x: interaction.startFrame.x + deltaX,
              y: interaction.startFrame.y + deltaY
            },
            screen
          )
        );
        return;
      }

      const rightEdge = interaction.startFrame.x + interaction.startFrame.width;
      const maximumWidth = Math.max(1, rightEdge - WINDOW_EDGE_GAP);
      const minimumWidth = Math.min(MIN_WINDOW_WIDTH, maximumWidth);
      const width = clamp(interaction.startFrame.width - deltaX, minimumWidth, maximumWidth);
      const maximumHeight = Math.max(1, screen.height - interaction.startFrame.y - WINDOW_EDGE_GAP);
      const minimumHeight = Math.min(MIN_WINDOW_HEIGHT, maximumHeight);
      const height = clamp(interaction.startFrame.height + deltaY, minimumHeight, maximumHeight);

      setWindowFrame({
        x: rightEdge - width,
        y: interaction.startFrame.y,
        width,
        height
      });
    };

    const handleMouseUp = () => {
      const interaction = windowInteractionRef.current;
      if (!interaction) return;
      windowInteractionRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (interaction.mode === "resize") {
        setWindowFrame((current) => {
          saveWindowSize(current);
          return current;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const fittedImageSize = useMemo<Size>(() => {
    if (!referenceImage || viewportSize.width === 0 || viewportSize.height === 0) {
      return { width: 0, height: 0 };
    }

    const availableWidth = Math.max(1, viewportSize.width - 24);
    const availableHeight = Math.max(1, viewportSize.height - 24);
    const scale = Math.min(
      availableWidth / referenceImage.width,
      availableHeight / referenceImage.height
    );
    return {
      width: referenceImage.width * scale,
      height: referenceImage.height * scale
    };
  }, [referenceImage, viewportSize]);

  const clampPan = useCallback(
    (nextPan: Point, atZoom: number): Point => {
      const maximumX = Math.max(0, (fittedImageSize.width * atZoom - viewportSize.width) / 2);
      const maximumY = Math.max(0, (fittedImageSize.height * atZoom - viewportSize.height) / 2);
      return {
        x: clamp(nextPan.x, -maximumX, maximumX),
        y: clamp(nextPan.y, -maximumY, maximumY)
      };
    },
    [fittedImageSize, viewportSize]
  );

  useEffect(() => {
    setPan((current) => clampPan(current, zoom));
  }, [clampPan, zoom]);

  const resetImageView = useCallback(() => {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
  }, []);

  const applyZoom = useCallback(
    (requestedZoom: number, focalPoint: Point = { x: 0, y: 0 }) => {
      setZoom((currentZoom) => {
        const nextZoom = clamp(requestedZoom, MIN_ZOOM, MAX_ZOOM);
        if (nextZoom === currentZoom) return currentZoom;

        const scaleChange = nextZoom / currentZoom;
        setPan((currentPan) =>
          clampPan(
            {
              x: focalPoint.x - (focalPoint.x - currentPan.x) * scaleChange,
              y: focalPoint.y - (focalPoint.y - currentPan.y) * scaleChange
            },
            nextZoom
          )
        );
        return nextZoom;
      });
    },
    [clampPan]
  );

  const saveReferenceImage = useCallback(
    async (nextImage: ProcessedReferenceImage, fileName: string) => {
      if (!activeTabId) return false;

      const tabId = activeTabId;
      const blobId = `${tabId}:${crypto.randomUUID()}`;
      const previousImage = useReferenceWindowStore.getState().imageMetadataByTabId[tabId];

      await saveReferenceImageBlob(blobId, nextImage.blob);

      const tabStillExists = useBillingTabsStore.getState().tabs.some((tab) => tab.id === tabId);
      if (!tabStillExists) {
        await deleteReferenceImageBlob(blobId);
        return false;
      }

      const metadata: ReferenceImageMetadata = {
        blobId,
        fileName,
        width: nextImage.width,
        height: nextImage.height,
        mimeType: nextImage.blob.type,
        byteSize: nextImage.blob.size
      };
      setImageMetadata(tabId, metadata);

      if (previousImage && previousImage.blobId !== blobId) {
        void deleteReferenceImageBlob(previousImage.blobId).catch(() => undefined);
      }
      if (useBillingTabsStore.getState().activeTabId === tabId) resetImageView();
      return true;
    },
    [activeTabId, resetImageView, setImageMetadata]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const file = Array.from(files).find((candidate) => candidate.type.startsWith("image/"));
      if (!file) {
        toast.error("Choose an image file to use as the reference.");
        return;
      }
      if (file.size > MAX_SOURCE_FILE_SIZE) {
        toast.error("Choose an image smaller than 12 MB.");
        return;
      }

      setOpen(true);
      setIsProcessing(true);
      try {
        const processedImage = await processImageFile(file);
        await saveReferenceImage(processedImage, file.name || "Pasted item list");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The image could not be opened.");
      } finally {
        setIsProcessing(false);
        setIsFileDragging(false);
      }
    },
    [saveReferenceImage, setOpen]
  );

  useEffect(() => {
    if (!activeTabId) return;

    const hasFiles = (dataTransfer: DataTransfer | null) =>
      Boolean(
        dataTransfer &&
        (dataTransfer.files.length > 0 || Array.from(dataTransfer.types).includes("Files"))
      );

    const handleScreenDragEnter = (event: globalThis.DragEvent) => {
      if (!hasFiles(event.dataTransfer)) return;
      event.preventDefault();
      screenDragDepthRef.current += 1;
      setIsFileDragging(true);
    };

    const handleScreenDragOver = (event: globalThis.DragEvent) => {
      if (!hasFiles(event.dataTransfer)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    };

    const handleScreenDragLeave = (event: globalThis.DragEvent) => {
      if (!hasFiles(event.dataTransfer)) return;
      event.preventDefault();
      screenDragDepthRef.current = Math.max(0, screenDragDepthRef.current - 1);
      if (screenDragDepthRef.current === 0) setIsFileDragging(false);
    };

    const handleScreenDrop = (event: globalThis.DragEvent) => {
      if (!hasFiles(event.dataTransfer)) return;
      event.preventDefault();
      screenDragDepthRef.current = 0;
      setIsFileDragging(false);
      if (event.dataTransfer) void handleFiles(event.dataTransfer.files);
    };

    const handleScreenPaste = (event: globalThis.ClipboardEvent) => {
      const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) =>
        item.type.startsWith("image/")
      );
      const file = imageItem?.getAsFile();
      if (!file) return;
      event.preventDefault();
      void handleFiles([file]);
    };

    window.addEventListener("dragenter", handleScreenDragEnter);
    window.addEventListener("dragover", handleScreenDragOver);
    window.addEventListener("dragleave", handleScreenDragLeave);
    window.addEventListener("drop", handleScreenDrop);
    window.addEventListener("paste", handleScreenPaste);
    return () => {
      window.removeEventListener("dragenter", handleScreenDragEnter);
      window.removeEventListener("dragover", handleScreenDragOver);
      window.removeEventListener("dragleave", handleScreenDragLeave);
      window.removeEventListener("drop", handleScreenDrop);
      window.removeEventListener("paste", handleScreenPaste);
      screenDragDepthRef.current = 0;
    };
  }, [activeTabId, handleFiles]);

  const handleRemove = () => {
    if (!activeTabId || !referenceImage) return;
    const blobId = referenceImage.blobId;
    removeImageMetadata(activeTabId);
    setReferenceImageBlob(null);
    resetImageView();
    void deleteReferenceImageBlob(blobId).catch(() => undefined);
    toast.success("Item list image removed");
  };

  const startWindowInteraction = (
    mode: WindowInteraction["mode"],
    event: ReactMouseEvent<HTMLElement>
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    windowInteractionRef.current = {
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startFrame: windowFrame
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = mode === "move" ? "move" : "nesw-resize";
  };

  const handleHeaderMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    startWindowInteraction("move", event);
  };

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 32 : 12;
    const screen = getScreenSize();

    setWindowFrame((current) => {
      let next = current;
      if (event.key === "ArrowLeft") {
        next = { ...current, x: current.x - step, width: current.width + step };
      } else if (event.key === "ArrowRight") {
        next = { ...current, x: current.x + step, width: current.width - step };
      } else if (event.key === "ArrowUp") {
        next = { ...current, height: current.height - step };
      } else if (event.key === "ArrowDown") {
        next = { ...current, height: current.height + step };
      }
      const clampedFrame = clampWindowFrame(next, screen);
      saveWindowSize(clampedFrame);
      return clampedFrame;
    });
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!isOpen || !referenceImageUrl || !viewport) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      const focalPoint = {
        x: event.clientX - bounds.left - bounds.width / 2,
        y: event.clientY - bounds.top - bounds.height / 2
      };
      const scaleFactor = Math.exp(-event.deltaY * 0.0015);
      applyZoom(zoom * scaleFactor, focalPoint);
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [applyZoom, isOpen, referenceImageUrl, zoom]);

  const handleImagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!referenceImageUrl || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    imageInteractionRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPan: pan
    };
    setIsPanning(true);
  };

  const handleImagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const interaction = imageInteractionRef.current;
    if (!interaction || interaction.pointerId !== event.pointerId) return;
    setPan(
      clampPan(
        {
          x: interaction.startPan.x + event.clientX - interaction.startClientX,
          y: interaction.startPan.y + event.clientY - interaction.startClientY
        },
        zoom
      )
    );
  };

  const finishImagePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (imageInteractionRef.current?.pointerId !== event.pointerId) return;
    imageInteractionRef.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleImageKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      applyZoom(zoom + ZOOM_STEP);
      return;
    }
    if (event.key === "-") {
      event.preventDefault();
      applyZoom(zoom - ZOOM_STEP);
      return;
    }
    if (event.key === "0") {
      event.preventDefault();
      resetImageView();
      return;
    }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    setPan((current) =>
      clampPan(
        {
          x:
            current.x +
            (event.key === "ArrowLeft" ? PAN_STEP : event.key === "ArrowRight" ? -PAN_STEP : 0),
          y:
            current.y +
            (event.key === "ArrowUp" ? PAN_STEP : event.key === "ArrowDown" ? -PAN_STEP : 0)
        },
        zoom
      )
    );
  };

  if (!activeTabId || (!isOpen && !isFileDragging)) return null;

  return createPortal(
    <>
      {isFileDragging && (
        <div
          data-billing-reference-drop-overlay
          className="border-counter-accent bg-counter-accent-soft/95 pointer-events-none fixed inset-2 z-50 flex items-center justify-center rounded-(--radius-panel) border-2 border-dashed shadow-lg"
        >
          <div className="bg-card border-frame flex items-center gap-3 rounded-(--radius-panel) border px-5 py-4 shadow-sm">
            <span className="bg-counter-accent-soft text-counter-accent-foreground flex size-10 items-center justify-center rounded-full">
              <CloudUpload className="size-5" />
            </span>
            <div>
              <div className="text-foreground text-sm font-semibold">
                {referenceImage ? "Drop to replace the reference image" : "Drop to open the image"}
              </div>
              <div className="text-muted-foreground mt-0.5 text-xs">
                Release anywhere on the billing screen
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          ref={panelRef}
          data-billing-reference-window
          className="border-strong bg-card fixed z-40 flex min-h-0 flex-col overflow-hidden rounded-(--radius-panel) border shadow-lg"
          style={{
            left: windowFrame.x,
            top: windowFrame.y,
            width: windowFrame.width,
            height: windowFrame.height
          }}
        >
          <div
            onMouseDown={handleHeaderMouseDown}
            className="bg-card border-b-frame flex h-10 shrink-0 cursor-move items-center gap-2 border-b px-2 active:cursor-grabbing"
          >
            <GripVertical className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            <span className="bg-counter-accent-soft text-counter-accent-foreground flex size-6 shrink-0 items-center justify-center rounded-(--radius-control)">
              <FileImage className="size-3.5" />
            </span>
            <div className="text-foreground min-w-0 flex-1 truncate text-xs font-semibold">
              {referenceImage?.fileName ?? "No image selected"}
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    aria-label={
                      referenceImage ? "Replace reference image" : "Choose reference image"
                    }
                  >
                    <Upload />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {referenceImage ? "Replace image" : "Choose image"}
                </TooltipContent>
              </Tooltip>

              {referenceImage && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleRemove}
                      aria-label="Remove reference image"
                    >
                      <Trash2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Remove image</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setOpen(false)}
                    aria-label="Close reference image"
                  >
                    <X />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Close</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {referenceImage ? (
            <>
              <div
                ref={viewportRef}
                role="region"
                tabIndex={0}
                aria-label="Reference image. Scroll to zoom, drag to move, or use plus and minus keys."
                onPointerDown={handleImagePointerDown}
                onPointerMove={handleImagePointerMove}
                onPointerUp={finishImagePan}
                onPointerCancel={finishImagePan}
                onDoubleClick={resetImageView}
                onKeyDown={handleImageKeyDown}
                className={cn(
                  "bg-muted focus-visible:ring-ring relative min-h-0 flex-1 touch-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset",
                  referenceImageUrl
                    ? zoom > MIN_ZOOM
                      ? "cursor-grab"
                      : "cursor-zoom-in"
                    : "cursor-default",
                  isPanning && "cursor-grabbing"
                )}
              >
                {isLoadingStoredImage && (
                  <div className="text-muted-foreground absolute inset-0 flex items-center justify-center gap-2 text-xs">
                    <LoaderCircle className="size-4 animate-spin" />
                    Loading image…
                  </div>
                )}

                {referenceImageUrl && fittedImageSize.width > 0 && (
                  <img
                    src={referenceImageUrl}
                    alt={`Handwritten order sheet: ${referenceImage.fileName}`}
                    draggable={false}
                    className="pointer-events-none absolute top-1/2 left-1/2 max-w-none shadow-sm select-none"
                    style={{
                      width: fittedImageSize.width,
                      height: fittedImageSize.height,
                      transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: "center"
                    }}
                  />
                )}

                <div className="bg-card/95 border-frame pointer-events-none absolute bottom-2 left-2 rounded-(--radius-control) border px-2 py-1 text-xs shadow-xs">
                  <span className="text-foreground font-medium">Scroll</span>
                  <span className="text-muted-foreground"> to zoom · </span>
                  <span className="text-foreground font-medium">drag</span>
                  <span className="text-muted-foreground"> to move</span>
                </div>

                <div className="bg-card border-frame absolute right-2 bottom-2 flex h-8 items-center rounded-(--radius-control) border shadow-xs">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      applyZoom(zoom - ZOOM_STEP);
                    }}
                    aria-label="Zoom out"
                    disabled={zoom <= MIN_ZOOM}
                  >
                    <Minus />
                  </Button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      resetImageView();
                    }}
                    className="text-foreground hover:bg-hover h-full min-w-12 border-x px-1 text-xs font-semibold tabular-nums"
                    aria-label="Reset image zoom"
                    title="Reset zoom and position"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      applyZoom(zoom + ZOOM_STEP);
                    }}
                    aria-label="Zoom in"
                    disabled={zoom >= MAX_ZOOM}
                  >
                    <Plus />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      resetImageView();
                    }}
                    aria-label="Fit image to window"
                    title="Fit image to window"
                  >
                    <RotateCcw />
                  </Button>
                </div>
              </div>

              <div className="bg-card border-t-frame text-muted-foreground flex h-8 shrink-0 items-center justify-between gap-3 border-t pr-2 pl-7 text-xs">
                <span className="truncate tabular-nums">
                  {referenceImage.width} × {referenceImage.height}
                </span>
                <span className="shrink-0">Double-click to fit</span>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className={cn(
                "bg-background-secondary focus-visible:ring-ring border-frame m-2 flex min-h-0 flex-1 flex-col items-center justify-center rounded-(--radius-panel) border-2 border-dashed px-6 text-center outline-none focus-visible:ring-2",
                isProcessing && "cursor-wait opacity-70"
              )}
            >
              <span className="bg-counter-accent-soft text-counter-accent-foreground flex size-11 items-center justify-center rounded-full">
                {isProcessing ? (
                  <Upload className="size-5 animate-pulse" />
                ) : (
                  <CloudUpload className="size-5" />
                )}
              </span>
              <span className="text-foreground mt-3 text-sm font-semibold">
                {isProcessing ? "Preparing image…" : "Upload item list"}
              </span>
              <span className="text-muted-foreground mt-1 max-w-60 text-xs leading-4">
                Drop or paste an image, or click to browse.
              </span>
              {!isProcessing && (
                <span className="text-muted-foreground mt-2 text-xs">
                  Most image types · Max 12 MB
                </span>
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              if (event.target.files) void handleFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <button
            type="button"
            onMouseDown={(event) => startWindowInteraction("resize", event)}
            onKeyDown={handleResizeKeyDown}
            className="focus-visible:ring-ring absolute bottom-0 left-0 z-10 size-3 cursor-nesw-resize border-0 bg-transparent p-0 outline-none focus-visible:ring-2"
            aria-label="Resize reference image window"
            title="Drag to resize. Arrow keys also resize."
          />
        </div>
      )}
    </>,
    document.body
  );
};

export default BillingReferenceWindow;
