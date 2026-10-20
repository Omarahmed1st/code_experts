// Ids for rows the admin creates: a prefix and 20 random hex characters (80 bits),
// e.g. les_3f9c0a1b2c3d4e5f6a7b. Not sequential or guessable. (Seeded content
// uses ids derived from its slug; see tools/build-content.ts.)
export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `${prefix}_${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}
