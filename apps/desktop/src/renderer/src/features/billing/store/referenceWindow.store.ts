import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type ReferenceImageMetadata = {
  blobId: string;
  fileName: string;
  width: number;
  height: number;
  mimeType: string;
  byteSize: number;
};

type ReferenceWindowStore = {
  isOpen: boolean;
  imageMetadataByTabId: Record<string, ReferenceImageMetadata>;
  setOpen: (isOpen: boolean) => void;
  toggle: () => void;
  setImageMetadata: (tabId: string, metadata: ReferenceImageMetadata) => void;
  removeImageMetadata: (tabId: string) => void;
};

export const useReferenceWindowStore = create<ReferenceWindowStore>()(
  devtools(
    (set) => ({
      isOpen: false,
      imageMetadataByTabId: {},
      setOpen: (isOpen) => set({ isOpen }, false, "referenceWindow/setOpen"),
      toggle: () => set((state) => ({ isOpen: !state.isOpen }), false, "referenceWindow/toggle"),
      setImageMetadata: (tabId, metadata) =>
        set(
          (state) => ({
            imageMetadataByTabId: {
              ...state.imageMetadataByTabId,
              [tabId]: metadata
            }
          }),
          false,
          "referenceWindow/setImageMetadata"
        ),
      removeImageMetadata: (tabId) =>
        set(
          (state) => {
            const imageMetadataByTabId = { ...state.imageMetadataByTabId };
            delete imageMetadataByTabId[tabId];
            return { imageMetadataByTabId };
          },
          false,
          "referenceWindow/removeImageMetadata"
        )
    }),
    { name: "billing-reference-window-store" }
  )
);
