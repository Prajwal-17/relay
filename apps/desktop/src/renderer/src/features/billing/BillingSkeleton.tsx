const BillingSkeleton = () => {
  return (
    <div className="bg-muted flex h-full w-full gap-4 overflow-hidden p-2 font-sans">
      <div className="flex h-full flex-1 flex-col gap-4">
        <div className="border-border bg-card animate-pulse rounded-xl border p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div className="space-y-3">
              <div className="bg-border h-8 w-32 rounded-md"></div>
              <div className="bg-muted h-5 w-48 rounded-md"></div>
            </div>
            <div className="flex gap-4">
              <div className="bg-muted h-10 w-24 rounded-md"></div>
              <div className="bg-muted h-10 w-24 rounded-md"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="bg-muted h-4 w-24 rounded"></div>
              <div className="bg-muted h-9 w-full rounded-lg"></div>
            </div>
            <div className="space-y-2">
              <div className="bg-muted h-4 w-24 rounded"></div>
              <div className="bg-muted h-9 w-full rounded-lg"></div>
            </div>
          </div>
        </div>

        <div className="border-border bg-card flex min-h-0 flex-1 animate-pulse flex-col rounded-xl border p-6 shadow-sm">
          <div className="bg-muted mb-4 h-9 w-full shrink-0 rounded-lg"></div>

          <div className="flex-1 space-y-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex h-16 w-full gap-4">
                <div className="bg-muted h-full w-12 rounded-md"></div>
                <div className="bg-muted h-full flex-1 rounded-md"></div>
                <div className="bg-muted h-full w-24 rounded-md"></div>
                <div className="bg-muted h-full w-24 rounded-md"></div>
                <div className="bg-muted h-full w-24 rounded-md"></div>
              </div>
            ))}
            <div className="bg-muted mt-4 h-10 w-32 rounded-md opacity-70"></div>
          </div>

          <div className="border-border mt-4 border-t pt-4">
            <div className="flex items-center justify-end">
              <div className="flex gap-3">
                <div className="bg-muted h-9 w-32 rounded-md opacity-50"></div>
                <div className="bg-muted h-9 w-24 rounded-md"></div>
                <div className="bg-muted h-9 w-24 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-border bg-card hidden h-full w-95 rounded-xl border p-4 lg:block">
        <div className="border-border flex h-full animate-pulse flex-col rounded-lg border-2 p-4">
          <div className="bg-muted mx-auto mb-2 h-6 w-3/4 rounded"></div>
          <div className="bg-muted mx-auto mb-6 h-4 w-1/2 rounded"></div>
          <div className="bg-muted mb-4 h-px w-full"></div>

          <div className="mb-auto space-y-3">
            <div className="bg-muted h-4 w-full rounded"></div>
            <div className="bg-muted h-4 w-full rounded"></div>
            <div className="bg-muted h-4 w-2/3 rounded"></div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-end">
              <div className="bg-muted h-5 w-1/3 rounded"></div>
            </div>
            <div className="flex justify-end">
              <div className="bg-border h-6 w-1/2 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSkeleton;
