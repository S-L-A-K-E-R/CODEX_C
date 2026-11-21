import { CEngine } from "./core.ts";
import type { RunRequest } from "./types.ts";
let engine: CEngine | undefined;
self.onmessage = async (event: MessageEvent<RunRequest>) => {
  try {
    engine ??= new CEngine(async (name, onProgress) => {
      const response = await fetch(new URL(name, event.data.assetBase));
      if (!response.ok)
        throw new Error(
          `Could not load ${name}. Check your connection, then try again.`,
        );

      // Report actual streamed bytes, not an estimated timer-based percentage.
      // Content-Length is usable only for the bytes exposed by Fetch.
      const declared = Number(response.headers.get("content-length"));
      const encoded = response.headers.get("content-encoding");
      const total = declared > 0 && (!encoded || encoded === "identity")
        ? declared
        : undefined;
      if (!response.body) {
        const data = new Uint8Array(await response.arrayBuffer());
        onProgress?.(data.byteLength, data.byteLength);
        return data;
      }
      const reader = response.body.getReader();
      // Preallocate when the server exposes the asset size, avoiding a second
      // full-sized copy of the large compiler files on memory-limited phones.
      let buffer =
        total !== undefined && total <= 100 * 1024 * 1024
          ? new Uint8Array(total)
          : undefined;
      const chunks: Uint8Array[] = [];
      let received = 0;
      onProgress?.(0, total);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const previous = received;
        received += value.byteLength;
        if (buffer && received <= buffer.byteLength) {
          buffer.set(value, previous);
        } else {
          if (buffer) {
            chunks.push(buffer.subarray(0, previous));
            buffer = undefined;
          }
          chunks.push(value);
        }
        onProgress?.(received, total);
      }
      let data: Uint8Array;
      if (buffer) {
        data = buffer.subarray(0, received);
      } else {
        data = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) {
          data.set(chunk, offset);
          offset += chunk.byteLength;
        }
      }
      // The exact size is known once each asset has finished, even without headers.
      onProgress?.(received, received);
      return data;
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
