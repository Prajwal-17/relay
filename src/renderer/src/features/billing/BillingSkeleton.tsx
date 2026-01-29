const BillingSkeleton = () => {
  return (
    <div className="flex h-full w-full gap-4 overflow-hidden bg-gray-100 p-2 font-sans">
      <div className="flex h-full flex-1 flex-col gap-4">
        {/* Header & Customer Div*/}
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div className="space-y-3">
              <div className="h-8 w-32 rounded-md bg-gray-300"></div>
              <div className="h-5 w-48 rounded-md bg-gray-200"></div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-24 rounded-md bg-gray-200"></div>
              <div className="h-10 w-24 rounded-md bg-gray-200"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200"></div>
              <div className="h-12 w-full rounded-lg bg-gray-100"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200"></div>
              <div className="h-12 w-full rounded-lg bg-gray-100"></div>
            </div>
          </div>
        </div>

        {/* Line Items & Footer */}
        <div className="flex min-h-0 flex-1 animate-pulse flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-12 w-full shrink-0 rounded-lg bg-gray-200"></div>

          <div className="flex-1 space-y-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex h-16 w-full gap-4">
                <div className="h-full w-12 rounded-md bg-gray-100"></div>
                <div className="h-full flex-1 rounded-md bg-gray-100"></div>
                <div className="h-full w-24 rounded-md bg-gray-100"></div>
                <div className="h-full w-24 rounded-md bg-gray-100"></div>
                <div className="h-full w-24 rounded-md bg-gray-100"></div>
              </div>
            ))}
            <div className="mt-4 h-10 w-32 rounded-md bg-yellow-50 opacity-70"></div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-end">
              <div className="flex gap-3">
                <div className="h-12 w-32 rounded-md bg-yellow-200 opacity-50"></div>
                <div className="h-12 w-24 rounded-md bg-gray-200"></div>
                <div className="h-12 w-24 rounded-md bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="hidden h-full w-[380px] rounded-xl border border-gray-200 bg-white p-4 lg:block">
        <div className="flex h-full animate-pulse flex-col rounded-lg border-2 border-green-50 p-4">
          <div className="mx-auto mb-2 h-6 w-3/4 rounded bg-gray-200"></div>
          <div className="mx-auto mb-6 h-4 w-1/2 rounded bg-gray-200"></div>
          <div className="mb-4 h-px w-full bg-gray-200"></div>

          <div className="mb-auto space-y-3">
            <div className="h-4 w-full rounded bg-gray-100"></div>
            <div className="h-4 w-full rounded bg-gray-100"></div>
            <div className="h-4 w-2/3 rounded bg-gray-100"></div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-end">
              <div className="h-5 w-1/3 rounded bg-gray-200"></div>
            </div>
            <div className="flex justify-end">
              <div className="h-6 w-1/2 rounded bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSkeleton;
