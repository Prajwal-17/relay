/** Owns the complete save lifecycle, including local cache update and return to Money. */
export function createEntrySaveFlow() {
  let response: unknown;
  const flow = {
    locked: false,
    committed: false,
    async run<TResponse>(steps: {
      request: () => Promise<TResponse>;
      synchronize: (response: TResponse) => Promise<unknown>;
      feedback: () => void | Promise<unknown>;
      complete: () => void;
      pending: (pending: boolean) => void;
      error: (message: string | null) => void;
      committed?: () => void;
    }) {
      if (flow.locked) return;
      flow.locked = true;
      steps.pending(true);
      steps.error(null);
      try {
        // A successful request must never be resent if later local cache update fails.
        if (!flow.committed) {
          response = await steps.request();
          flow.committed = true;
          steps.committed?.();
        }
        await steps.synchronize(response as TResponse);
        await steps.feedback();
        steps.complete();
      } catch (error) {
        steps.error(
          flow.committed
            ? "Entry saved. Could not update this screen; retry to finish."
            : error instanceof Error
              ? error.message
              : "Could not save this entry. Please try again."
        );
        flow.locked = false;
        steps.pending(false);
      }
    }
  };
  return flow;
}
