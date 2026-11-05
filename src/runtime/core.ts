import { WASI, type WASIFS } from "@runno/wasi";
import { gunzipSync } from "fflate";
import type { ProgramResult, RunRequest, RunResponse } from "./types.ts";
import { limitVirtualFiles } from "./limits.ts";

export const OUTPUT_LIMIT = 64 * 1024;
const timestamps = {
  access: new Date(0),
  modification: new Date(0),
  change: new Date(0),
};
const textFile = (path: string, content: string) => ({
  path,
  content,
  mode: "string" as const,
  timestamps,
});
export type AssetLoader = (name: string) => Promise<Uint8Array>;

// The upstream sysroot is a regular POSIX tar. Reject paths outside the virtual sysroot.
export function unpackSysroot(compressed: Uint8Array): WASIFS {
  // Some static hosts send .gz assets with Content-Encoding:gzip, so Fetch
  // already decompresses them. Accept that tar representation as well.
  const bytes =
    compressed[0] === 31 && compressed[1] === 139
      ? gunzipSync(compressed)
      : compressed;
  const decoder = new TextDecoder(),
    fs: WASIFS = {};
  if (
    bytes.length < 512 ||
    !decoder.decode(bytes.subarray(0, 100)).startsWith("sys/")
  )
    throw new Error(
      "The compiler filesystem was not served correctly. Rebuild the runtime assets and reload.",
    );
  for (let offset = 0; offset + 512 <= bytes.length; ) {
    const header = bytes.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const read = (start: number, end: number) =>
      decoder.decode(header.subarray(start, end)).split("\0")[0];
    const name = read(0, 100),
      prefix = read(345, 500);
    const size = parseInt(read(124, 136).trim(), 8) || 0;
    const path = "/" + (prefix ? prefix + "/" : "") + name.replace(/^\.\//, "");
    if (header[156] === 0 || header[156] === 48) {
      if (
        !path.startsWith("/sys/") ||
        path.split("/").includes("..") ||
        offset + 512 + size > bytes.length
      )
        throw new Error("Invalid compiler sysroot.");
      fs[path] = {
        path,
        timestamps,
        mode: "binary",
        content: bytes.slice(offset + 512, offset + 512 + size),
      };
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  if (!fs["/sys/include/stdio.h"])
    throw new Error("Compiler headers are missing.");
  return fs;
}

export class CEngine {
  private assets?: Promise<{
    clang: WebAssembly.Module;
    linker: WebAssembly.Module;
    fs: WASIFS;
  }>;
  private load: AssetLoader;
  constructor(load: AssetLoader) {
    this.load = load;
  }
  async prepare(progress: (phase: string) => void) {
    if (!this.assets) {
      progress("Loading C compiler · first download is about 53 MB");
      this.assets = Promise.all(
        ["clang.wasm", "wasm-ld.wasm", "clang-fs.tar.gz"].map(this.load),
      )
        .then(async ([c, l, f]) => ({
          clang: await WebAssembly.compile(c as Uint8Array<ArrayBuffer>),
          linker: await WebAssembly.compile(l as Uint8Array<ArrayBuffer>),
          fs: unpackSysroot(f),
        }))
        .catch((error) => {
          this.assets = undefined;
          throw error;
        });
    }
    return this.assets;
  }
  private async execute(
    module: WebAssembly.Module,
    fs: WASIFS,
    args: string[],
    input = "",
    boundedFiles = false,
  ) {
    let stdout = "",
      stderr = "",
      inputOffset = 0,
      outputBytes = 0;
    const append = (stream: "stdout" | "stderr", text: string) => {
      if (stdout.length + stderr.length + text.length > OUTPUT_LIMIT)
        throw new Error(
          "Output limit reached (64 KiB). Check your loop condition.",
        );
      if (stream === "stdout") stdout += text;
      else stderr += text;
    };
    const wasi = new WASI({
      fs,
      args,
      env: { PWD: "/" },
      stdout: (out) => append("stdout", out),
      stderr: (out) => append("stderr", out),
    });
    if (boundedFiles) limitVirtualFiles(wasi);
    // C may split UTF-8 characters across writes (even putchar calls). Keep
    // a streaming decoder per output descriptor and enforce the byte limit.
    const decoders = [new TextDecoder(), new TextDecoder()],
      write = wasi.fd_write.bind(wasi);
    wasi.fd_write = (fd, iovs, count, result) => {
      if (fd !== 1 && fd !== 2) return write(fd, iovs, count, result);
      const memory = new DataView(wasi.memory.buffer);
      let written = 0;
      for (let i = 0; i < count; i++) {
        const pointer = memory.getUint32(iovs + i * 8, true),
          length = memory.getUint32(iovs + i * 8 + 4, true);
        if (outputBytes + length > OUTPUT_LIMIT)
          throw new Error(
            "Output limit reached (64 KiB). Check your loop condition.",
          );
        outputBytes += length;
        written += length;
        append(
          fd === 1 ? "stdout" : "stderr",
          decoders[fd - 1].decode(
            new Uint8Array(wasi.memory.buffer, pointer, length),
            { stream: true },
          ),
        );
      }
      memory.setUint32(result, written, true);
      return 0;
    };
    // Old wasi-libc resolves relative paths only against a '.' preopen. Expose
    // the SAME virtual root under '/' and '.', never a real host directory.
    wasi.drive.openMap.set(4, wasi.drive.openMap.get(3)!);
    wasi.drive.nextFD = Math.max(5, wasi.drive.nextFD);
    const prestat = wasi.fd_prestat_get.bind(wasi),
      preName = wasi.fd_prestat_dir_name.bind(wasi);
    wasi.fd_prestat_get = (fd, address) => prestat(fd === 4 ? 3 : fd, address);
    wasi.fd_prestat_dir_name = (fd, address, length) => {
      if (fd !== 4) return preName(fd, address, length);
      if (length > 0) new Uint8Array(wasi.memory.buffer)[address] = 46;
      return 0;
    };
    // Read raw bytes so scanf/fgetc cannot truncate long input or split UTF-8.
    const inputBytes = new TextEncoder().encode(input),
      originalRead = wasi.fd_read.bind(wasi);
    wasi.fd_read = (fd, iovs, count, result) => {
      if (fd !== 0) return originalRead(fd, iovs, count, result);
      const memory = new DataView(wasi.memory.buffer);
      let read = 0;
      for (let i = 0; i < count; i++) {
        const pointer = memory.getUint32(iovs + i * 8, true),
          capacity = memory.getUint32(iovs + i * 8 + 4, true);
        const length = Math.min(capacity, inputBytes.length - inputOffset);
        new Uint8Array(wasi.memory.buffer, pointer, length).set(
          inputBytes.subarray(inputOffset, inputOffset + length),
        );
        inputOffset += length;
        read += length;
      }
      memory.setUint32(result, read, true);
      return 0;
    };
    const instance = await WebAssembly.instantiate(
      module,
      wasi.getImportObject(),
    );
    const result = wasi.start({ module, instance });
    append("stdout", decoders[0].decode());
    append("stderr", decoders[1].decode());
    if (result.exitCode === 134 && !stderr)
      stderr =
        "The program trapped (for example, an invalid memory access or exhausted stack).\n";
    return { ...result, stdout, stderr };
  }
  async run(
    request: Pick<RunRequest, "files" | "inputs">,
    progress: (phase: string) => void = () => {},
  ): Promise<RunResponse> {
    if (!Object.hasOwn(request.files, "main.c"))
      throw new Error("The workspace needs a main.c file.");
    if (
      Object.keys(request.files).length > 20 ||
      Object.values(request.files).reduce((n, x) => n + x.length, 0) > 200_000
    )
      throw new Error("Workspace is too large (20 files / 200 KB).");
    const assets = await this.prepare(progress);
    let fs: WASIFS = structuredClone(assets.fs),
      diagnostics = "";
    for (const [name, content] of Object.entries(request.files)) {
      if (
        !/^[a-zA-Z0-9_-][a-zA-Z0-9_.-]{0,79}$/.test(name) ||
        name.includes("..")
      )
        throw new Error("Use simple filenames without folders.");
      fs["/" + name] = textFile("/" + name, content);
    }
    const objects: string[] = [];
    progress("Compiling C17");
    for (const name of Object.keys(request.files).filter((name) =>
      name.endsWith(".c"),
    )) {
      const object = "/_codex_" + objects.length + ".o";
      const compile = await this.execute(assets.clang, fs, [
        "clang",
        "-cc1",
        "-triple",
        "wasm32-unknown-wasi",
        "-std=c17",
        "-isysroot",
        "/sys",
        "-internal-isystem",
        "/sys/include",
        "-internal-isystem",
        "/sys/lib/clang/8.0.1/include",
        "-I/",
        "-Wall",
        "-Wextra",
        "-ferror-limit",
        "5",
        "-O0",
        "-emit-obj",
        "-o",
        object,
        "/" + name,
      ]);
      diagnostics += compile.stderr;
      if (compile.exitCode !== 0)
        return {
          results: [],
          diagnostics,
          error: "Compilation failed. Check the highlighted lines.",
        };
      fs = compile.fs;
      objects.push(object);
    }
    progress("Linking your program");
    const link = await this.execute(assets.linker, fs, [
      "wasm-ld",
      "--no-threads",
      "--export-dynamic",
      "-z",
      "stack-size=1048576",
      "--max-memory=67108864",
      "-L/sys/lib/wasm32-wasi",
      "/sys/lib/wasm32-wasi/crt1.o",
      ...objects,
      "-lc",
      "-lm",
      "-o",
      "/_codex_program.wasm",
    ]);
    diagnostics += link.stderr;
    if (link.exitCode !== 0)
      return {
        results: [],
        diagnostics,
        error: "Linking failed. Check declarations and definitions.",
      };
    const binary = link.fs["/_codex_program.wasm"];
    if (binary?.mode !== "binary")
      throw new Error("The compiler did not produce a program.");
    const program = await WebAssembly.compile(
      binary.content as Uint8Array<ArrayBuffer>,
    );
    const results: ProgramResult[] = [];
    // Each run starts from the same user files, without compiler tools or previous test output.
    for (const [i, input] of request.inputs.entries()) {
      progress(`Running ${i + 1} of ${request.inputs.length}`);
      const clean: WASIFS = Object.fromEntries(
        Object.entries(request.files).map(([name, content]) => [
          "/" + name,
          textFile("/" + name, content),
        ]),
      );
      const run = await this.execute(program, clean, ["program"], input, true);
      const files: Record<string, string> = {};
      let fileBytes = 0;
      for (const [path, file] of Object.entries(run.fs)) {
        if (path.startsWith("/_codex_")) continue;
        const content =
          file.mode === "string"
            ? file.content
            : new TextDecoder().decode(file.content);
        fileBytes += content.length;
        if (fileBytes > 256_000)
          throw new Error("Virtual file output exceeds 256 KB.");
        files[path.slice(1)] = content;
      }
      results.push({
        stdout: run.stdout,
        stderr: run.stderr,
        exitCode: run.exitCode,
        files,
      });
    }
    return { results, diagnostics };
  }
}
