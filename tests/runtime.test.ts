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
