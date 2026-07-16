import { Button } from "@/components/ui/button";
import { formatDateStr } from "@shared/utils/dateUtils";
import { FileText, Upload } from "lucide-react";
import { mockAttachments } from "../../_mock/data";

export function AttachmentsTab() {
  const attachments = mockAttachments;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-medium">
          {attachments.length} document{attachments.length === 1 ? "" : "s"}
        </p>
        <Button variant="outline" className="h-9 cursor-pointer">
          <Upload className="size-4" />
          Upload Document
        </Button>
      </div>

      {attachments.length === 0 ? (
        <div className="bg-card border-border rounded-xl border shadow-xs">
          <div className="border-border m-4 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
            <span className="bg-muted text-muted-foreground mb-5 flex size-12 items-center justify-center rounded-xl">
              <Upload className="size-6" />
            </span>
            <h3 className="text-foreground text-base font-semibold tracking-[-0.02em]">
              No documents attached
            </h3>
            <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
              Upload GST certificates, agreements, or any reference files for this customer.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border-border rounded-xl border shadow-xs">
          <ul className="divide-border/70 divide-y">
            {attachments.map((att) => (
              <li key={att.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="bg-info/15 text-info flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">{att.name}</p>
                    <p className="text-muted-foreground text-xs font-medium tabular-nums">
                      {att.sizeKb} KB · {formatDateStr(att.date)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="h-8 cursor-pointer text-xs">
                  Download
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
