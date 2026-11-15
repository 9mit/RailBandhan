import { AppError } from "@/lib/errors";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
const execute = promisify(execFile);
export interface OcrResult {
  text: string;
  confidence: number;
  engine: string;
  latencyMs: number;
}
export interface LocalOcrEngine {
  recognize(
    imageBuffer: Buffer,
    mimeType: string,
    filename?: string,
  ): Promise<OcrResult>;
}
function extractPdfTextFallback(buffer: Buffer): string {
  const content = buffer.toString("latin1");
  const lines: string[] = [];
  const matches = content.matchAll(/\(([^)]+)\)\s*Tj/g);
  for (const match of matches) {
    lines.push(match[1].replace(/\\([()\\])/g, "$1"));
  }
  return lines.join("\n");
}

let active = 0;
/** Local binaries only: no uploads to third parties and no filename-derived data. */
export class NativeOcrEngine implements LocalOcrEngine {
  async recognize(buffer: Buffer, mimeType: string): Promise<OcrResult> {
    if (active >= 2)
      throw new AppError(
        "unavailable",
        "The ticket reader is busy. Please try again shortly.",
      );
    active++;
    const start = Date.now();
    let dir: string | undefined;
    const deadline = start + 20000;
    const run = async (command: string, args: string[]) =>
      execute(command, args, {
        timeout: Math.max(1, deadline - Date.now()),
        maxBuffer: 512 * 1024,
        encoding: "utf8",
        env: { ...process.env, OMP_THREAD_LIMIT: "1" },
      });
    try {
      dir = await mkdtemp(path.join(tmpdir(), "rail-ticket-"));
      const input = path.join(
        dir,
        mimeType === "application/pdf" ? "ticket.pdf" : "ticket.png",
      );
      await writeFile(input, buffer, { mode: 0o600 });
      let text = "";
      let engine = "tesseract-native";
      if (mimeType === "application/pdf") {
        try {
          const result = await run("pdftotext", [
            "-f",
            "1",
            "-l",
            "6",
            "-layout",
            input,
            "-",
          ]);
          text = result.stdout;
          engine = "poppler-local";
        } catch (err: unknown) {
          const code = (err as { code?: string | number })?.code;
          if (code === "ENOENT" || code === 127) {
            text = extractPdfTextFallback(buffer);
            engine = "pdf-stream-local";
          } else {
            throw err;
          }
        }
        if (!text.trim()) {
          try {
            const prefix = path.join(dir, "page");
            await run("pdftoppm", [
              "-f",
              "1",
              "-singlefile",
              "-scale-to",
              "1800",
              "-png",
              input,
              prefix,
            ]);
            text = (
              await run("tesseract", [
                prefix + ".png",
                "stdout",
                "-l",
                "eng",
                "--psm",
                "6",
              ])
            ).stdout;
            engine = "poppler-tesseract-local";
          } catch {
            if (!text.trim()) {
              text = extractPdfTextFallback(buffer);
              if (text.trim()) engine = "pdf-stream-local";
            }
          }
        }
      } else {
        text = (
          await run("tesseract", [input, "stdout", "-l", "eng", "--psm", "6"])
        ).stdout;
      }
      if (!text.trim())
        throw new AppError(
          "validation",
          "The ticket could not be read. Upload a valid ticket or enter your journey manually.",
        );
      return {
        text: text.slice(0, 64000),
        confidence: 0,
        engine,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        "validation",
        "The ticket could not be read. Upload a valid ticket or enter the journey manually.",
      );
    } finally {
      active--;
      if (dir) await rm(dir, { recursive: true, force: true });
    }
  }
}
export function getLocalOcrEngine(): LocalOcrEngine {
  return new NativeOcrEngine();
}
