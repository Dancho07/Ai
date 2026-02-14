import crypto from "crypto";

const algorithm = "aes-256-gcm";

function keyBuffer() {
  const key = process.env.TOKEN_ENCRYPTION_KEY ?? "";
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptToken(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptToken(payload: string) {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
