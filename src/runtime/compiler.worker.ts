import { CEngine } from "./core.ts";
import { COMPILER_ASSET_BYTES, loadCachedCompilerAsset } from "./assets.ts";
import type { RunRequest } from "./types.ts";

let engine: CEngine | undefined;
self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try {
    engine ??= new CEngine((name, onProgress) => {
      const size = COMPILER_ASSET_BYTES[name as keyof typeof COMPILER_ASSET_BYTES];
      if (!size) throw new Error(`Unknown compiler asset: ${name}`);
      return loadCachedCompilerAsset(
        new URL(name, event.data.assetBase).href,
        size,
        (loaded, total) => onProgress?.(loaded, total),
        () => self.postMessage({
          phase: "Loading C compiler · downloading required files",
        }),
      );
    });
    const result = await engine.run(
      event.data,
      (phase) => self.postMessage({ phase }),
      (download) => self.postMessage({ download }),
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
