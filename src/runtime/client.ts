import type { RunResponse } from "./types.ts";
let worker: Worker | undefined;
let cancelPending: (() => void) | undefined;
export function stopProgram() {
  cancelPending?.();
  worker?.terminate();
  worker = undefined;
}
export function runProgram(
  files: Record<string, string>,
  inputs: string[],
  onPhase: (text: string) => void,
): Promise<RunResponse> {
  stopProgram();
  // A dedicated worker makes stop and timeouts reliable even for while(1) {}.
  worker = new Worker(new URL("./compiler.worker.ts", import.meta.url), {
    type: "module",
  });
  const current = worker;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: RunResponse) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cancelPending = undefined;
      current.terminate();
      if (worker === current) worker = undefined;
      resolve(value);
    };
    let timer = setTimeout(
      () =>
        finish({
          results: [],
          diagnostics: "",
          error:
            "Compiler download timed out. Check your connection and try again.",
        }),
      120_000,
    );
    cancelPending = () =>
      finish({
        results: [],
        diagnostics: "",
        error: "Stopped. Your code is saved.",
      });
    current.onmessage = ({ data }) => {
      if (data.phase) {
        onPhase(data.phase);
        clearTimeout(timer);
        const limit = data.phase.startsWith("Running")
          ? 3000
          : data.phase.startsWith("Loading")
            ? 120_000
            : 30_000;
        timer = setTimeout(
          () =>
            finish({
              results: [],
              diagnostics: "",
              error: data.phase.startsWith("Running")
                ? "Time limit reached (3 seconds per test). Check your loop condition."
                : "Compilation timed out. Try a smaller program or reload.",
            }),
          limit,
        );
      }
      if (data.done) finish(data);
    };
    current.onerror = (event) =>
      finish({
        results: [],
        diagnostics: "",
        error:
          event.message ||
          "The compiler worker could not start. Reload and try again.",
      });
    current.postMessage({
      files,
      inputs,
      assetBase: new URL("./runtime/", document.baseURI).href,
    });
  });
}
