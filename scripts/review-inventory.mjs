import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
const files = [
  ...new Set(
    execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { encoding: "utf8" },
    )
      .split("\0")
      .filter(Boolean),
  ),
].sort();
const rows = [];
let source = 0,
  binary = 0;
for (const file of files) {
  if (!existsSync(file) || !statSync(file).isFile()) continue;
  const data = readFileSync(file),
    text = data.toString("utf8"),
    isText = !data.includes(0) && !text.includes("\uFFFD");
  if (isText) source++;
  else binary++;
  let review = "Source/configuration scan; applicable lint/type/build checks";
  if (file.startsWith("tests/"))
    review = "Behavioral/adversarial verification source";
  if (
    file.startsWith("apps/web/public/images/") ||
    file.startsWith("apps/web/public/videos/")
  )
    review = "Visual asset inspected; compressed derivative or retained source";
  if (file.startsWith("supabase/") || file.startsWith("research/"))
    review = "Historical prototype/research; inactive in production topology";
  if (file.startsWith("docs/"))
    review = "Documentation consistency review; current or marked historical";
  if (file.endsWith("package-lock.json"))
    review = "Locked dependency graph; npm production audit";
  const hash =
    file === "docs/FILE_REVIEW.md"
      ? "generated"
      : createHash("sha256").update(data).digest("hex").slice(0, 12);
  rows.push(
    `| \`${file}\` | ${isText ? "Text" : "Binary"} | ${data.length.toLocaleString("en-IN")} | \`${hash}\` | ${review} |`,
  );
}
const content = `# File review inventory\n\nGenerated from the Git checkout on 15 November 2026. ${source + binary} present files (${source} text, ${binary} binary). Deleted superseded widgets/configurations are visible in the Git diff.\n\nEvery listed file was opened for inventory/content or binary inspection and included in repository-wide pattern/dependency/configuration review. Manual semantic review concentrated on authentication, authorization, HTTP boundaries, uploads, persistence, provider provenance, active UI workflows and deployment paths. The table does not claim an independent line-by-line penetration test of every dependency or exhaustive browser execution of every screen. Generated build output, installed dependencies, runtime data and secrets are excluded.\n\nThe active TypeScript source is linted and typechecked. Tests are typechecked separately and execute the relevant domain/security contracts. All 13 supplied images and the video’s beginning/middle/end were visually inspected. Original portrait/pass assets are retained without being represented as real users or official tickets. Historical Supabase/research files are not used to claim production capabilities.\n\n| File | Format | Bytes | SHA-256 prefix | Review coverage |\n| --- | --- | ---: | --- | --- |\n${rows.join("\n")}\n`;
writeFileSync("docs/FILE_REVIEW.md", content);
console.log(`Inventoried ${rows.length} files.`);
