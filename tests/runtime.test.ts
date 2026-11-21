import { COMPILER_ASSET_BYTES, COMPILER_TOTAL_BYTES, loadCachedCompilerAsset } from "../src/runtime/assets.ts";

test("compiler asset manifest matches pinned binaries", () => {
  assert.equal(COMPILER_TOTAL_BYTES, 52_495_428);
  assert.equal(Object.keys(COMPILER_ASSET_BYTES).length, 3);
});

test("compiler download tracks real streamed bytes and reuses persistent cache", async () => {
  const originalFetch = globalThis.fetch;
  const originalCache = Object.getOwnPropertyDescriptor(globalThis, "caches");
  const content = Uint8Array.from([10, 20, 30, 40, 50, 60]);
  const store = new Map<string, Response>();
  const url = "https://example.org/runtime/test.wasm";
  let fetches = 0;
  let started = 0;
  const reported: number[] = [];
  try {
    Object.defineProperty(globalThis, "caches", {
      configurable: true,
      value: {
        open: async () => ({
          match: async (key: string) => store.get(key)?.clone(),
          put: async (key: string, response: Response) => { store.set(key, response.clone()); },
          delete: async (key: string) => store.delete(key),
        }),
      },
    });
    globalThis.fetch = async () => {
      fetches++;
      return new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(content.slice(0, 2));
          controller.enqueue(content.slice(2, 5));
          controller.enqueue(content.slice(5));
          controller.close();
        },
      }));
    };
    const progress = (loaded: number, total: number) => {
      assert.equal(total, content.length);
      reported.push(loaded);
    };
    const first = await loadCachedCompilerAsset(url, content.length, progress, () => { started++; });
    assert.deepEqual(first, content);
    assert.deepEqual(reported, [0, 2, 5, 6]);
    assert.equal(fetches, 1);
    assert.equal(started, 1);

    reported.length = 0;
    const again = await loadCachedCompilerAsset(url, content.length, progress, () => { started++; });
    assert.deepEqual(again, content);
    assert.deepEqual(reported, [6]);
    assert.equal(fetches, 1, "cached assets must not be re-downloaded");
    assert.equal(started, 1, "cache hits must not show a download bar");

    store.set(url, new Response(new Uint8Array([99])));
    await loadCachedCompilerAsset(url, content.length, progress, () => { started++; });
    assert.equal(fetches, 2, "invalid cache entries must be re-fetched");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCache) Object.defineProperty(globalThis, "caches", originalCache);
    else Reflect.deleteProperty(globalThis, "caches");
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "fflate";
import { WASI } from "@runno/wasi";
import { unpackSysroot } from "../src/runtime/core.ts";
import { limitVirtualFiles, FILE_LIMIT } from "../src/runtime/limits.ts";

function smallTar(name: string, value = "header") {
  const bytes = new Uint8Array(2048),
    encoder = new TextEncoder();
  bytes.set(encoder.encode(name));
  bytes.set(
    encoder.encode(value.length.toString(8).padStart(11, "0") + "\0"),
    124,
  );
  bytes[156] = 48;
  bytes.set(encoder.encode(value), 512);
  return bytes;
}
test("sysroot accepts gzip and HTTP-decompressed tar, rejects HTML and traversal", () => {
  const tar = smallTar("sys/include/stdio.h");
  assert.deepEqual(unpackSysroot(gzipSync(tar)), unpackSysroot(tar));
  assert.throws(() =>
    unpackSysroot(new TextEncoder().encode("<html>Not found</html>")),
  );
  assert.throws(() => unpackSysroot(smallTar("sys/../../outside")));
});
test("virtual file budgets stop sparse allocation and repeated writes before buffers grow", () => {
  const wasi = new WASI({ fs: {} });
  limitVirtualFiles(wasi);
  const result = wasi.drive.open(3, "output.txt", 1, 0);
  assert.equal(result[0], 0);
  const fd = result[1]!;
  wasi.drive.write(fd, new Uint8Array(12));
  assert.throws(
    () => wasi.drive.pwrite(fd, new Uint8Array(1), 1_000_000_000),
    /Virtual file limit/,
  );
  assert.throws(
    () => wasi.drive.setSize(fd, 1_000_000_000n),
    /Virtual file limit/,
  );
  assert.throws(
    () => wasi.fd_allocate(fd, 0n, 1_000_000_000n),
    /Virtual file limit/,
  );
  assert.equal(wasi.drive.stat(fd)[1]?.byteLength, 12);
  wasi.drive.pwrite(fd, new Uint8Array(FILE_LIMIT - 12), 0);
  assert.throws(
    () => wasi.drive.write(fd, new Uint8Array(1)),
    /Virtual file limit/,
  );
});
test("virtual filesystem rejects traversal and unbounded open handles", () => {
  const wasi = new WASI({ fs: {} });
  limitVirtualFiles(wasi);
  assert.throws(
    () => wasi.drive.open(3, "../outside", 1, 0),
    /filesystem limit/,
  );
  for (let i = 0; i < 63; i++) wasi.drive.open(3, "file" + i, 1, 0);
  assert.throws(() => wasi.drive.open(3, "excess", 1, 0), /filesystem limit/);
});
