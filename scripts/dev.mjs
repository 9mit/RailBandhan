import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const args = process.argv.slice(2);
const flags = ["dev"];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--host" || args[i] === "--hostname") {
    flags.push("--hostname", args[++i]);
  } else if (args[i] === "--port" || args[i] === "-p") {
    flags.push("--port", args[++i]);
  } else if (args[i] !== "--strictPort") flags.push(args[i]);
}
const app = fileURLToPath(new URL("../apps/web/", import.meta.url));
const child = spawn(
  process.execPath,
  [`${app}node_modules/next/dist/bin/next`, ...flags],
  { cwd: app, stdio: "inherit", env: process.env },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
