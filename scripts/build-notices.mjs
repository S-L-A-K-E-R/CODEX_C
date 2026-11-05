import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
let output =
  "CODEX C — THIRD-PARTY SOFTWARE NOTICES\n\nGenerated from installed production packages. Compiler notices are served in ./licenses/.\n";
for (const [path, info] of Object.entries(lock.packages)) {
  if (!path.startsWith("node_modules/") || info.dev) continue;
  let entries;
  try {
    entries = await readdir(path, { withFileTypes: true });
  } catch {
    continue;
  }
  const manifest = JSON.parse(
    await readFile(join(path, "package.json"), "utf8"),
  );
  output +=
    "\n\n" +
    "=".repeat(72) +
    "\n" +
    manifest.name +
    " " +
    manifest.version +
    " — " +
    (manifest.license || "see upstream") +
    "\n";
  const notices = entries.filter(
    (entry) =>
      entry.isFile() && /^(licen[sc]e|copying|notice)(\.|$)/i.test(entry.name),
  );
  if (!notices.length)
    throw new Error("Missing licence text for " + manifest.name);
  for (const entry of notices)
    output += "\n" + (await readFile(join(path, entry.name), "utf8"));
}
await writeFile("public/third-party-notices.txt", output);
console.log("Generated production dependency notices.");
