import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

// Immutable upstream snapshot; no code or student data is sent to this origin.
const revision = "af05728f02d907210d28587b4c32a306e79e312e";
const files = {
  "clang.wasm":
    "2a466f0e990329d3230b869d04fc20803eae96a7feb3a3f6c93e25a77b8aed1d",
  "wasm-ld.wasm":
    "36419ed202011765222098d7701218378b67f634d50f0a4625059ae2c9860f48",
  "clang-fs.tar.gz":
    "7ed12063619882e4dfa710ab371fc91848b256f85a4075747e8bd5c167902b50",
};
const directory = fileURLToPath(new URL("../public/runtime/", import.meta.url));
await mkdir(directory, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const [name, expected] of Object.entries(files)) {
  const path = directory + "/" + name;
  try {
    if (hash(await readFile(path)) === expected) {
      console.log(`Verified ${name}`);
      continue;
    }
  } catch {}
  console.log(`Downloading pinned ${name}…`);
  const response = await fetch(
    `https://raw.githubusercontent.com/taybenlor/runno/${revision}/langs/${name}`,
    { signal: AbortSignal.timeout(120000) },
  );
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (hash(bytes) !== expected)
    throw new Error(`${name}: SHA-256 mismatch; refusing this asset.`);
  await writeFile(path, bytes);
  console.log(`Verified ${name}: ${bytes.byteLength} bytes`);
}
