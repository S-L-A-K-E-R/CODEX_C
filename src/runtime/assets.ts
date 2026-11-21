// Pinned byte lengths of the three immutable Clang/WASI runtime assets.
// Match scripts/fetch-runtime.mjs; the website does not estimate download progress by time.
export const COMPILER_ASSET_BYTES = {
  "clang.wasm": 31_214_472,
  "wasm-ld.wasm": 19_490_094,
  "clang-fs.tar.gz": 1_790_862,
} as const;

export const COMPILER_TOTAL_BYTES = Object.values(COMPILER_ASSET_BYTES).reduce(
  (sum, size) => sum + size,
  0,
);

// The hash suffix identifies the pinned upstream runtime revision. A new runtime
// requires a new cache name, leaving earlier builds safely isolated.
const CACHE_NAME = "codex-c-compiler-af05728f02d90721";

const isValidAsset = (url: string, bytes: Uint8Array, expected: number) =>
  bytes.byteLength === expected ||
  // Some hosts HTTP-decompress the gzip sysroot before Fetch exposes it.
  (url.endsWith("clang-fs.tar.gz") &&
    bytes.byteLength >= 512 &&
    new TextDecoder().decode(bytes.subarray(0, 4)) === "sys/");

/**
 * Load an asset from persistent Cache Storage when available, otherwise stream
 * the actual network bytes and save the complete, validated response.
 * Browser storage may be unavailable or quota-restricted; those failures must
 * not prevent C programs from running.
 */
export async function loadCachedCompilerAsset(
  url: string,
  expectedBytes: number,
  onProgress: (loadedBytes: number, totalBytes: number) => void,
  onNetwork: () => void,
): Promise<Uint8Array> {
  let cache: Cache | undefined;
  try {
    if (typeof caches !== "undefined") {
      cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) {
        const data = new Uint8Array(await cached.arrayBuffer());
        if (isValidAsset(url, data, expectedBytes)) {
          onProgress(expectedBytes, expectedBytes);
          return data;
        }
        await cache.delete(url);
      }
    }
  } catch {
    cache = undefined;
  }

  onNetwork();
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(
      `Could not load ${url.split("/").at(-1)}. Check your connection, then try again.`,
    );

  onProgress(0, expectedBytes);
  let data: Uint8Array;
  if (!response.body) {
    data = new Uint8Array(await response.arrayBuffer());
    onProgress(data.byteLength, expectedBytes);
  } else {
    const reader = response.body.getReader();
    // Preallocate the known file size: no second giant copy on mobile devices.
    let buffer: Uint8Array | undefined = new Uint8Array(expectedBytes);
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const previous = received;
      received += value.byteLength;
      if (received > 100 * 1024 * 1024)
        throw new Error("Compiler asset exceeds the 100 MB safety limit.");
      if (buffer && received <= buffer.byteLength) {
        buffer.set(value, previous);
      } else {
        if (buffer) {
          chunks.push(buffer.subarray(0, previous));
          buffer = undefined;
        }
        chunks.push(value);
      }
      onProgress(received, expectedBytes);
    }
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
  }

  if (!isValidAsset(url, data, expectedBytes))
    throw new Error("The compiler download was incomplete or invalid. Try again.");

  // Only write fully received assets to persistent storage. A cancelled or
  // interrupted download can never produce a cache hit on the next run.
  try {
    await cache?.put(url, new Response(data as BodyInit));
  } catch {
    // Private browsing and full storage quotas still allow normal execution.
  }
  return data;
}
