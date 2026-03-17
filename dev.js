/**
 * Dev launcher — starts the Express API server (port 3001) and Vite dev server (port 3000) together.
 * Vite proxies /api requests to the Express server.
 * Manually loads .env so the server process has all required environment variables.
 */
import { spawn } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import net from "net";
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

function canListenOnPort(port) {
  return new Promise((resolvePort) => {
    const tester = net.createServer();
    tester.once("error", () => resolvePort(false));
    tester.once("listening", () => {
      tester.close(() => resolvePort(true));
    });
    tester.listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(startPort, maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = startPort + i;
    // eslint-disable-next-line no-await-in-loop
    if (await canListenOnPort(candidate)) return candidate;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const apiPort = await findAvailablePort(3001);
console.log(`[dev] API server port: ${apiPort}`);

const server = spawn("npx", ["tsx", "server/index.ts"], {
  stdio: "inherit",
  shell,
  env: { ...process.env, PORT: String(apiPort) },
});

const vite = spawn("npx", ["vite", "--host"], {
  stdio: "inherit",
  shell,
  env: { ...process.env, VITE_API_PORT: String(apiPort) },
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
