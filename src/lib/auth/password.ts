// Password hashing with scrypt (OWASP Password Storage Cheat Sheet: N=2^15, r=8, p=3).
//
// node:crypto's scrypt is native in both Node (the create-admin tool) and the
// Workers runtime (nodejs_compat), so the same code hashes and verifies in both.
// Stored form:  scrypt$<N>$<r>$<p>$<salt, base64>$<hash, base64>
// The parameters travel with the hash, so they can be raised later; verifyPassword
// reports when a stored hash uses weaker ones (needsRehash) and login upgrades it.
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

export const SCRYPT = { N: 2 ** 15, r: 8, p: 3, keyLength: 32, saltLength: 16 } as const;

/** Long passphrases are welcome; the cap only stops someone sending megabytes to hash. */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 200;

function scrypt(password: string, salt: Buffer, N: number, r: number, p: number, keyLength: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // 128 * N * r bytes of memory (32 MiB for the defaults), plus headroom.
    scryptCallback(password.normalize("NFKC"), salt, keyLength, { N, r, p, maxmem: 256 * N * r }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT.saltLength);
  const key = await scrypt(password, salt, SCRYPT.N, SCRYPT.r, SCRYPT.p, SCRYPT.keyLength);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export interface VerifyResult {
  ok: boolean;
  /** The hash is valid but uses weaker parameters than SCRYPT: store a new one. */
  needsRehash: boolean;
}

export async function verifyPassword(password: string, stored: string): Promise<VerifyResult> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return { ok: false, needsRehash: false };
  const [N, r, p] = parts.slice(1, 4).map(Number) as [number, number, number];
  const salt = Buffer.from(parts[4] ?? "", "base64");
  const expected = Buffer.from(parts[5] ?? "", "base64");
  const sane = [N, r, p].every((n) => Number.isInteger(n) && n > 0) && N <= 2 ** 20 && r <= 32 && p <= 16;
  if (!sane || salt.length === 0 || expected.length === 0) return { ok: false, needsRehash: false };
  const key = await scrypt(password, salt, N, r, p, expected.length);
  const ok = timingSafeEqual(key, expected);
  return { ok, needsRehash: ok && (N < SCRYPT.N || r < SCRYPT.r || p < SCRYPT.p) };
}

/**
 * Spends the same time as a real check when there is no such account, so the
 * answer time doesn't reveal which emails have accounts.
 */
let dummyHash: string | null = null;
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= await hashPassword("not-a-real-password");
  await verifyPassword(password, dummyHash);
}

/** Why a new password isn't acceptable, or null when it is. */
export function passwordProblem(password: string, email = ""): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters. A few words in a row is easy to remember.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  if (new Set(password).size < 4) return "That password repeats the same few characters. Choose something less predictable.";
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 4 && password.toLowerCase().includes(local)) return "Don't use your email address in your password.";
  return null;
}
