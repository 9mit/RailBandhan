import { describe, it, expect } from "vitest";
import { mkdtemp, writeFile, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
// @ts-expect-error A small native ESM operational helper is intentionally shared with Node CLIs.
import { encryptBackup, decryptBackup } from "../scripts/backup-format.mjs";
describe("Encrypted backup format", () => {
  it("round-trips private dumps and rejects tampering before restore", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "backup-test-"));
    try {
      const input = path.join(dir, "input"),
        sealed = path.join(dir, "backup"),
        output = path.join(dir, "output"),
        invalid = path.join(dir, "invalid");
      const data = randomBytes(128000),
        key = randomBytes(32).toString("hex");
      await writeFile(input, data, { mode: 0o600 });
      await encryptBackup(input, sealed, key);
      if (process.platform !== "win32") {
        expect((await stat(sealed)).mode & 0o777).toBe(0o600);
      }
      await decryptBackup(sealed, output, key);
      expect(await readFile(output)).toEqual(data);
      const tampered = await readFile(sealed);
      tampered[100] ^= 1;
      await writeFile(sealed, tampered);
      await expect(decryptBackup(sealed, invalid, key)).rejects.toThrow();
      await expect(stat(invalid)).rejects.toThrow();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
