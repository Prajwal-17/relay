import { ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";

export const PDF_EXPORT_TOAST_DURATION = 6000;

export function showPdfExportSuccessToast(filePath: string, toastId?: string) {
  toast.success(
    (toastInstance) => (
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-medium">PDF saved successfully</span>
        <button
          type="button"
          onClick={() => {
            window.exportApi.showItemInFolder(filePath);
            toast.dismiss(toastInstance.id);
          }}
          className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 text-sm leading-none font-medium transition-colors hover:underline"
        >
          <span>Open</span>
          <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    ),
    { id: toastId, duration: PDF_EXPORT_TOAST_DURATION }
  );
}
