import { CEngine } from "./core.ts";
import type { RunRequest } from "./types.ts";
let engine: CEngine | undefined;
self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try {
    engine ??= new CEngine(async (name) => {
      const response = await fetch(new URL(name, event.data.assetBase));
      if (!response.ok)
        throw new Error(
          `Could not load ${name}. Check your connection, then try again.`,
        );
      return new Uint8Array(await response.arrayBuffer());
    });
    const result = await engine.run(event.data, (phase) =>
      self.postMessage({ phase }),
    );
    self.postMessage({ done: true, ...result });
  } catch (error) {
    self.postMessage({
      done: true,
      results: [],
      diagnostics: "",
      error:
        error instanceof Error
          ? error.message
          : "The C runtime stopped unexpectedly.",
    });
  }
};
