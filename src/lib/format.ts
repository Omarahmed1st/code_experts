const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "8 Oct 2026" from a millisecond timestamp (UTC, so server and browser agree). */
export function formatDate(ms: number): string {
  return DATE.format(new Date(ms));
}

/** "2026-10-08" for <time dateTime>. */
export function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
