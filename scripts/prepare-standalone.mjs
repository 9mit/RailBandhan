import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const app = fileURLToPath(new URL("../apps/web/", import.meta.url));
const destination = path.join(app, ".next", "standalone", "apps", "web");
await mkdir(path.join(destination, ".next"), { recursive: true });
await cp(path.join(app, "public"), path.join(destination, "public"), {
  recursive: true,
});
await cp(
  path.join(app, ".next", "static"),
  path.join(destination, ".next", "static"),
  { recursive: true },
);
console.log(
  "Prepared the standalone application with its public and static assets.",
);
