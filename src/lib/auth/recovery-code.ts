// Recovery codes for student accounts. There is no email sending yet, so a
// student who forgets their password proves who they are with the code shown
// once when they signed up (or made again on the settings page). Only its
// SHA-256 is stored (verifications row "recovery:<user id>").
//
// 16 characters from 31 easy-to-read capitals and digits (no 0/O, 1/I/L):
// about 79 bits, in groups of four. Typing is forgiving: case, spaces and
// dashes don't matter.

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const RECOVERY_CODE_LENGTH = 16;

export function newRecoveryCode(): string {
  const chars: string[] = [];
  while (chars.length < RECOVERY_CODE_LENGTH) {
    for (const b of crypto.getRandomValues(new Uint8Array(32))) {
      // Rejection sampling keeps every character equally likely.
      if (b < 256 - (256 % ALPHABET.length)) chars.push(ALPHABET[b % ALPHABET.length]!);
      if (chars.length === RECOVERY_CODE_LENGTH) break;
    }
  }
  return chars.join("").replace(/(.{4})(?=.)/g, "$1-");
}

/** The code as stored (hashed): capitals, no separators. null when it can't be a code. */
export function normalizeRecoveryCode(input: unknown): string | null {
  if (typeof input !== "string" || input.length > 64) return null;
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== RECOVERY_CODE_LENGTH || ![...code].every((c) => ALPHABET.includes(c))) return null;
  return code;
}

export const recoveryKey = (userId: string) => `recovery:${userId}`;
/** Set when an administrator gave the account a temporary password (shared with the staff accounts). */
export const passwordChangeKey = (userId: string) => `password-change:${userId}`;
