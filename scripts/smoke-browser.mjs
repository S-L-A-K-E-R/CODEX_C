// Minimal Chromium smoke test: an HTTP 200 and successful build do not prove React mounted.
// Uses the browser preinstalled on GitHub's Ubuntu runner; no test framework dependency.
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 4173;
const base = "http://127.0.0.1:" + PORT + "/";
const server = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
  stdio: "ignore",
  detached: true,
});
const binary = [process.env.CHROME_BIN, "google-chrome", "chromium", "chromium-browser"]
  .filter(Boolean)
  .find((name) => spawnSync(name, ["--version"], { encoding: "utf8", timeout: 5000 }).status === 0);

if (!binary) {
  process.kill(-server.pid, "SIGTERM");
  throw new Error("Chromium/Chrome is required for the browser smoke test.");
}

function render(url) {
  const run = spawnSync(binary, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--disable-extensions", "--disable-background-networking", "--no-first-run",
    "--virtual-time-budget=15000", "--dump-dom", url,
  ], { encoding: "utf8", timeout: 50000, maxBuffer: 12 * 1024 * 1024 });
  if (run.error || run.status !== 0)
    throw new Error("Chromium failed: " + (run.error?.message || run.stderr || run.status));
  return run.stdout;
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 45; attempt++) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(base);
      if (response.ok) { ready = true; break; }
    } catch { /* preview not ready */ }
    await sleep(250);
  }
  if (!ready) throw new Error("Preview did not start on port " + PORT);

  for (const [route, expected] of [
    ["#path", "STARTER MEADOW"],
    ["#path/loops", "THE WINDING RIVER"],
    ["#path/data-structures", "THE FINAL FORTRESS"],
  ]) {
    const html = render(base + route);
    if (!html.includes('class="app-shell"') ||
        !html.includes('class="world-overview"') ||
        !html.includes('class="world-region-index"') ||
        html.includes('class="world-atlas-grid"') ||
        !html.includes('class="ascii-map-grid"') ||
        !html.includes('class="chapter-map-node ') ||
        !html.includes(expected) ||
        !html.includes("FINAL")) {
      throw new Error("Browser loaded a blank or incomplete page for " + route +
        "; expected " + expected + ". DOM excerpt: " + html.slice(0, 1800));
    }
    console.log("PASS browser render " + route + ": " + expected);
  }
} finally {
  try { process.kill(-server.pid, "SIGTERM"); } catch { /* already exited */ }
}
