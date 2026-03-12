/**
 * Dev launcher — starts the Express API server (port 3001) and Vite dev server (port 3000) together.
 * Vite proxies /api requests to the Express server.
 * Manually loads .env so the server process has all required environment variables.
 */
import { spawn } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse and load .env into process.env so the server child process inherits them
function loadEnv() {
  try {
    const envPath = resolve(__dirname, ".env");
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) {
        process.env[key] = val;
      }
    }
  } catch {
    // .env not found — assume env vars are set via the shell
  }
}

loadEnv();

const isWindows = process.platform === "win32";
const shell = isWindows;

const server = spawn("npx", ["tsx", "server/index.ts"], {
  stdio: "inherit",
  shell,
  env: { ...process.env, PORT: "3001" },
});

const vite = spawn("npx", ["vite", "--host"], {
  stdio: "inherit",
  shell,
});

function cleanup() {
  server.kill();
  vite.kill();
}

process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(0); });
process.on("SIGTERM", () => { cleanup(); process.exit(0); });

server.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[server] exited with code ${code}`);
    vite.kill();
    process.exit(code ?? 1);
  }
});

vite.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[vite] exited with code ${code}`);
    server.kill();
    process.exit(code ?? 1);
  }
});
