/**
 * Dev launcher — starts the Express API server (port 3001) and Vite dev server (port 3000) together.
 * Vite proxies /api requests to the Express server.
 */
import { spawn } from "child_process";

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
