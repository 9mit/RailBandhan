import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
let developmentKey: Buffer | undefined;
function vaultKey(): Buffer {
  const configured = process.env.TICKET_ENCRYPTION_KEY;
  if (configured) {
    if (!/^[a-fA-F0-9]{64}$/.test(configured))
      throw new Error(
        "TICKET_ENCRYPTION_KEY must be 64 hexadecimal characters",
      );
    return Buffer.from(configured, "hex");
  }
  if (process.env.NODE_ENV === "production")
    throw new Error("TICKET_ENCRYPTION_KEY is required in production");
  if (developmentKey) return developmentKey;
  if (process.env.NODE_ENV === "test")
    return (developmentKey = randomBytes(32));
  const dir =
    process.env.TICKET_STORAGE_DIR ??
    path.join(process.cwd(), ".data", "tickets");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const keyPath = path.join(dir, ".vault-key");
  try {
    developmentKey = readFileSync(keyPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    try {
      writeFileSync(keyPath, randomBytes(32), { mode: 0o600, flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    developmentKey = readFileSync(keyPath);
  }
  if (developmentKey.length !== 32) throw new Error("Invalid local vault key");
  return developmentKey;
}
export function encryptTicket(buffer: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", vaultKey(), iv);
  const body = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([Buffer.from("RBV1"), iv, cipher.getAuthTag(), body]);
}
export function decryptTicket(buffer: Buffer): Buffer {
  if (buffer.length < 32 || buffer.subarray(0, 4).toString() !== "RBV1")
    throw new Error("Invalid encrypted ticket");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    vaultKey(),
    buffer.subarray(4, 16),
  );
  decipher.setAuthTag(buffer.subarray(16, 32));
  return Buffer.concat([
    decipher.update(buffer.subarray(32)),
    decipher.final(),
  ]);
}
