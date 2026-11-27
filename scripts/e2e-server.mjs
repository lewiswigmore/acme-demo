import { spawn } from "node:child_process";
import { rmSync } from "node:fs";

for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  rmSync(`test-data/e2e.sqlite${suffix}`, { force: true });
}
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3000",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DEMO_DB_PATH: "test-data/e2e.sqlite",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.kill(signal));
server.on("exit", (code) => process.exit(code ?? 0));
