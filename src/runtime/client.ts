import type { DownloadProgress, RunResponse } from "./types.ts";
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
  onDownload: (progress: DownloadProgress) => void = () => {},
): Promise<RunResponse> {
  stopProgram();
  // A dedicated worker makes stop and timeouts reliable even for while(1) {}.
  worker = new Worker(new URL("./compiler.worker.ts", import.meta.url), {
    type: "module",
  });
  const current = worker;
  return new Promise((resolve) => {
    let settled = false;
    const downloadError =
      "Compiler download timed out. Check your connection and try again.";
    let downloadDeadline: ReturnType<typeof setTimeout> | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const finish = (value: RunResponse) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(downloadDeadline);
      cancelPending = undefined;
      current.terminate();
      if (worker === current) worker = undefined;
      resolve(value);
    };
    const failDownload = () =>
      finish({ results: [], diagnostics: "", error: downloadError });
    const resetTimer = (ms: number, error: string) => {
      clearTimeout(timer);
      timer = setTimeout(
        () => finish({ results: [], diagnostics: "", error }),
        ms,
      );
    };
    // A slow but active first download may take much longer than two minutes.
    // Require activity within 90 seconds, but cap the transfer at ten minutes.
    timer = setTimeout(failDownload, 120_000);
    cancelPending = () =>
      finish({
        results: [],
        diagnostics: "",
        error: "Stopped. Your code is saved.",
      });
    current.onmessage = ({ data }) => {
      if (settled) return;
      if (data.phase) {
        onPhase(data.phase);
        if (data.phase.startsWith("Loading C compiler")) {
          downloadDeadline ??= setTimeout(failDownload, 600_000);
          resetTimer(90_000, downloadError);
        } else {
          clearTimeout(downloadDeadline);
          downloadDeadline = undefined;
          const limit = data.phase.startsWith("Running")
            ? 3000
            : data.phase === "Preparing C compiler"
              ? 120_000
              : 30_000;
          resetTimer(
            limit,
            data.phase.startsWith("Running")
              ? "Time limit reached (3 seconds per test). Check your loop condition."
              : "Compilation timed out. Try a smaller program or reload.",
          );
        }
      }
      if (data.download) {
        onDownload(data.download);
        if (downloadDeadline) resetTimer(90_000, downloadError);
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
