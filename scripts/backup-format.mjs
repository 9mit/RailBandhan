import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { open, stat, unlink } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
const MAGIC = Buffer.from("RBK1");
function key(value) {
  if (!/^[a-fA-F0-9]{64}$/.test(value || ""))
    throw new Error("BACKUP_ENCRYPTION_KEY must be 64 hexadecimal characters");
  return Buffer.from(value, "hex");
}
export async function encryptBackup(
  source,
  destination,
  secret,
  onCreated = () => {},
) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  cipher.setAAD(MAGIC);
  const output = await open(destination, "wx", 0o600);
  onCreated();
  await output.write(Buffer.concat([MAGIC, iv]));
  await output.close();
  try {
    await pipeline(
      typeof source === "string" ? createReadStream(source) : source,
      cipher,
      createWriteStream(destination, { flags: "a", mode: 0o600 }),
    );
    const file = await open(destination, "a");
    try {
      await file.write(cipher.getAuthTag());
    } finally {
      await file.close();
    }
  } catch (error) {
    await unlink(destination).catch(() => {});
    throw error;
  }
}
export async function decryptBackup(source, destination, secret) {
  const size = (await stat(source)).size;
  if (size < 32) throw new Error("Invalid backup");
  const input = await open(source, "r");
  const header = Buffer.alloc(16),
    tag = Buffer.alloc(16);
  try {
    await input.read(header, 0, 16, 0);
    await input.read(tag, 0, 16, size - 16);
  } finally {
    await input.close();
  }
  if (!header.subarray(0, 4).equals(MAGIC))
    throw new Error("Invalid backup format");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(secret),
    header.subarray(4),
  );
  decipher.setAAD(MAGIC);
  decipher.setAuthTag(tag);
  try {
    await pipeline(
      createReadStream(source, { start: 16, end: size - 17 }),
      decipher,
      createWriteStream(destination, { flags: "wx", mode: 0o600 }),
    );
  } catch (error) {
    await unlink(destination).catch(() => {});
    throw error;
  }
}
